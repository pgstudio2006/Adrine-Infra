import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { InventoryRuntimeService } from './inventory-runtime.service';

@ApiTags('inventory')
@ApiSecurity('tenant')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryRuntimeService) {}

  @Get('catalog')
  catalog(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.inventory.listCatalog(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 200,
    );
  }

  @Post('catalog')
  upsertCatalog(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
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
    return this.inventory.upsertCatalogItem(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Post('moves')
  createMove(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
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
    return this.inventory.createStockMove(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('moves')
  listMoves(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.inventory.listStockMoves(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('moves/:id')
  getMove(@Req() req: Request, @Param('id') id: string) {
    return this.inventory.getStockMove((req as RequestWithTenant).tenantId!, id);
  }

  @Post('moves/:id/transition')
  transition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    return this.inventory.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
