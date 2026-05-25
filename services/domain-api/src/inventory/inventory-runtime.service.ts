import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateInventoryTransition,
  HospitalPlatformEvents,
  type InventoryStockMoveState,
  type InventoryValidationContext,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';

@Injectable()
export class InventoryRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async listCatalog(tenantId: string, branchId: string, take = 200) {
    return this.prisma.inventoryCatalogItem.findMany({
      where: { tenantId, branchId, isActive: true },
      orderBy: { name: 'asc' },
      take,
    });
  }

  async upsertCatalogItem(
    tenantId: string,
    branchId: string,
    body: {
      sku: string;
      name: string;
      category?: string;
      unit?: string;
      qtyOnHand?: number;
      reorderLevel?: number;
      unitCostCents?: number;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const existing = await this.prisma.inventoryCatalogItem.findUnique({
      where: { tenantId_branchId_sku: { tenantId, branchId, sku: body.sku } },
    });
    const row = await this.prisma.inventoryCatalogItem.upsert({
      where: { tenantId_branchId_sku: { tenantId, branchId, sku: body.sku } },
      create: {
        tenantId,
        branchId,
        sku: body.sku,
        name: body.name,
        category: body.category ?? 'General',
        unit: body.unit ?? 'pcs',
        qtyOnHand: body.qtyOnHand ?? 0,
        reorderLevel: body.reorderLevel ?? 0,
        unitCostCents: body.unitCostCents ?? 0,
      },
      update: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        reorderLevel: body.reorderLevel,
        unitCostCents: body.unitCostCents,
        ...(body.qtyOnHand !== undefined ? { qtyOnHand: body.qtyOnHand } : {}),
      },
    });
    if (!existing) {
      await this.platformEvents.record({
        tenantId,
        branchId,
        eventName: HospitalPlatformEvents.inventory.itemCreated,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'inventory_catalog_item',
        resourceId: row.id,
        payload: { sku: body.sku },
      });
    }
    return row;
  }

  async createStockMove(
    tenantId: string,
    branchId: string,
    body: {
      catalogItemId: string;
      moveType: string;
      quantity: number;
      fromLocation?: string;
      toLocation?: string;
      externalRef?: string;
      requestedBy?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const item = await this.prisma.inventoryCatalogItem.findFirst({
      where: { id: body.catalogItemId, tenantId, branchId, isActive: true },
    });
    if (!item) throw new NotFoundException('Catalog item not found');

    return this.prisma.inventoryStockMove.create({
      data: {
        tenantId,
        branchId,
        catalogItemId: body.catalogItemId,
        moveType: body.moveType,
        quantity: body.quantity,
        fromLocation: body.fromLocation,
        toLocation: body.toLocation,
        externalRef: body.externalRef,
        requestedBy: body.requestedBy,
        state: 'draft',
      },
      include: { catalogItem: true },
    });
  }

  async listStockMoves(tenantId: string, branchId: string, take = 100) {
    return this.prisma.inventoryStockMove.findMany({
      where: { tenantId, branchId },
      include: { catalogItem: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getStockMove(tenantId: string, id: string) {
    const row = await this.prisma.inventoryStockMove.findFirst({
      where: { id, tenantId },
      include: { catalogItem: true, transitions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!row) throw new NotFoundException('Stock move not found');
    return row;
  }

  async transition(
    tenantId: string,
    moveId: string,
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: InventoryValidationContext;
      expectedVersion?: number;
    },
  ) {
    const row = await this.getStockMove(tenantId, moveId);
    const fromState = row.state as InventoryStockMoveState;

    if (body.expectedVersion !== undefined && body.expectedVersion !== row.version) {
      throw new ConflictException('Stock move version mismatch; refresh and retry');
    }

    const item = row.catalogItem;
    const ctx: InventoryValidationContext = {
      quantityPositive: body.context?.quantityPositive ?? row.quantity > 0,
      catalogItemActive: body.context?.catalogItemActive ?? item.isActive,
      approvalWithinPolicy: body.context?.approvalWithinPolicy ?? true,
      stockAvailable: body.context?.stockAvailable ?? item.qtyOnHand >= row.quantity,
      receiptConfirmed: body.context?.receiptConfirmed ?? true,
      cancelReasonProvided: body.context?.cancelReasonProvided ?? !!body.reason,
      ...body.context,
    };

    const result = evaluateInventoryTransition({
      state: fromState,
      action: body.action,
      actorRole: body.actorRole,
      validationContext: ctx,
    });

    if (!result.ok) {
      throw new BadRequestException({ code: result.code, message: result.reason });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.inventoryStockMove.update({
        where: { id: moveId },
        data: { state: result.nextState, version: { increment: 1 } },
        include: { catalogItem: true },
      });

      if (result.nextState === 'received') {
        const delta =
          row.moveType === 'receive' || row.moveType === 'adjustment'
            ? row.quantity
            : -row.quantity;
        await tx.inventoryCatalogItem.update({
          where: { id: row.catalogItemId },
          data: { qtyOnHand: { increment: delta } },
        });
      }

      await tx.inventoryStockMoveTransition.create({
        data: {
          tenantId,
          stockMoveId: moveId,
          action: body.action,
          fromState,
          toState: result.nextState,
          actorId: body.actorId,
          actorRole: body.actorRole,
          reason: body.reason,
        },
      });
      return next;
    });

    for (const eventName of result.events) {
      await this.platformEvents.record({
        tenantId,
        branchId: row.branchId,
        eventName,
        actorId: body.actorId,
        actorRole: body.actorRole,
        resourceType: 'inventory_stock_move',
        resourceId: moveId,
        payload: { action: body.action, fromState, toState: result.nextState },
      });
    }

    return { move: updated, transition: result };
  }
}
