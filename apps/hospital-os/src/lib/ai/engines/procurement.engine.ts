// ── Layer 7: Procurement Intelligence Engine ──

import type {
  PharmacyInventoryItem,
  PrescriptionOrder,
} from '@/stores/hospitalStore';

import type {
  ProcurementIntelligence,
  ReorderAlert,
  ExpiryRisk,
  ConsumptionAnomaly,
  VendorConcentration,
  IntelligenceAlert,
} from '../types';

import { PROCUREMENT_THRESHOLDS } from '../constants';
import { groupBy, countBy, pct, parseStoreDate, daysBetween, alertId } from '../utils';

// ── Input contract ──
export interface ProcurementInput {
  pharmacyInventory: PharmacyInventoryItem[];
  prescriptions: PrescriptionOrder[];
}

// ── Main computation ──
export function computeProcurementIntelligence(input: ProcurementInput): ProcurementIntelligence {
  const { pharmacyInventory, prescriptions } = input;
  const alerts: IntelligenceAlert[] = [];
  const now = new Date();
  const nowIso = now.toISOString();

  // ── 1. Reorder alerts ──
  const reorderAlerts = computeReorderAlerts(pharmacyInventory, prescriptions, now);

  // ── 2. Expiry risks ──
  const expiryRisks = computeExpiryRisks(pharmacyInventory, now);

  // ── 3. Consumption anomalies ──
  const consumptionAnomalies = computeConsumptionAnomalies(pharmacyInventory, prescriptions);

  // ── 4. Vendor concentration ──
  const vendorConcentration = computeVendorConcentration(pharmacyInventory);

  // ── 5. Total inventory value ──
  const totalInventoryValue = pharmacyInventory.reduce((s, item) => s + item.qty * item.price, 0);

  // ── 6. Cost per patient ──
  const uniquePrescriptionPatients = new Set(prescriptions.map((rx) => rx.uhid));
  const costPerPatient = uniquePrescriptionPatients.size > 0
    ? Math.round((totalInventoryValue / uniquePrescriptionPatients.size) * 100) / 100
    : 0;

  // ── 7. Generate alerts ──

  const criticalItems = reorderAlerts.filter((r) => r.urgency === 'critical');
  if (criticalItems.length > 0) {
    alerts.push({
      id: alertId('procurement'),
      category: 'pharmacy-stock',
      severity: 'critical',
      title: 'Out-of-Stock Items',
      message: `${criticalItems.length} item(s) are completely out of stock: ${criticalItems.map((i) => i.drug).join(', ')}.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Place emergency orders immediately for out-of-stock items.',
    });
  }

  const highReorderItems = reorderAlerts.filter((r) => r.urgency === 'high');
  if (highReorderItems.length > 0) {
    alerts.push({
      id: alertId('procurement'),
      category: 'pharmacy-stock',
      severity: 'high',
      title: 'Low Stock Warning',
      message: `${highReorderItems.length} item(s) are critically low: ${highReorderItems.map((i) => i.drug).join(', ')}.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Initiate reorder for items below 50% of reorder level.',
    });
  }

  const imminentExpiry = expiryRisks.filter((e) => e.daysUntilExpiry <= 30);
  if (imminentExpiry.length > 0) {
    const totalRisk = imminentExpiry.reduce((s, e) => s + e.financialRisk, 0);
    alerts.push({
      id: alertId('procurement'),
      category: 'pharmacy-stock',
      severity: 'high',
      title: 'Imminent Expiry Risk',
      message: `${imminentExpiry.length} item(s) expiring within 30 days with financial risk of ${formatCurrency(totalRisk)}.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Prioritize dispensing near-expiry stock or arrange return-to-vendor.',
    });
  }

  const mediumExpiry = expiryRisks.filter((e) => e.daysUntilExpiry > 30 && e.daysUntilExpiry <= 90);
  if (mediumExpiry.length > 0) {
    alerts.push({
      id: alertId('procurement'),
      category: 'pharmacy-stock',
      severity: 'medium',
      title: 'Upcoming Expiry Warning',
      message: `${mediumExpiry.length} item(s) will expire within 31-90 days.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Plan stock rotation and prioritize near-expiry items for dispensing.',
    });
  }

  const concentratedVendors = vendorConcentration.filter((v) => v.isConcentrated);
  if (concentratedVendors.length > 0) {
    for (const vendor of concentratedVendors) {
      alerts.push({
        id: alertId('procurement'),
        category: 'pharmacy-stock',
        severity: 'medium',
        title: `Vendor Concentration: ${vendor.supplier}`,
        message: `${vendor.supplier} supplies ${vendor.percentage}% of inventory items (${vendor.itemCount} items). High supplier dependence increases supply chain risk.`,
        timestamp: nowIso,
        actionable: true,
        suggestedAction: `Diversify procurement sources to reduce dependence on ${vendor.supplier}.`,
      });
    }
  }

  const highAnomalies = consumptionAnomalies.filter((a) => a.riskLevel === 'high');
  if (highAnomalies.length > 0) {
    alerts.push({
      id: alertId('procurement'),
      category: 'pharmacy-stock',
      severity: 'high',
      title: 'High-Demand Drug Stock Mismatch',
      message: `${highAnomalies.length} frequently prescribed drug(s) have dangerously low stock: ${highAnomalies.map((a) => a.drug).join(', ')}.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Cross-reference prescription volume with stock levels and reorder urgently.',
    });
  }

  return {
    reorderAlerts,
    expiryRisks,
    consumptionAnomalies,
    vendorConcentration,
    costPerPatient,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    alerts,
  };
}

// ── Helpers ──

function computeReorderAlerts(
  inventory: PharmacyInventoryItem[],
  prescriptions: PrescriptionOrder[],
  now: Date,
): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];

  const drugConsumption: Record<string, number> = {};
  for (const rx of prescriptions) {
    for (const med of rx.meds) {
      const drugKey = med.drug.toLowerCase();
      drugConsumption[drugKey] = (drugConsumption[drugKey] || 0) + med.qty;
    }
  }

  for (const item of inventory) {
    if (item.qty > item.reorder) continue;

    let urgency: ReorderAlert['urgency'];
    if (item.qty === PROCUREMENT_THRESHOLDS.criticalStockMultiplier) {
      urgency = 'critical';
    } else if (item.qty <= item.reorder * PROCUREMENT_THRESHOLDS.highStockMultiplier) {
      urgency = 'high';
    } else {
      urgency = 'medium';
    }

    const drugKey = item.drug.toLowerCase();
    const totalPrescribed = drugConsumption[drugKey] || 0;

    const dailyConsumption = totalPrescribed > 0 ? totalPrescribed / 30 : 0;
    const daysUntilStockout = dailyConsumption > 0
      ? Math.max(0, Math.round(item.qty / dailyConsumption))
      : item.qty === 0 ? 0 : 999;

    alerts.push({
      itemId: item.id,
      drug: item.drug,
      currentQty: item.qty,
      reorderLevel: item.reorder,
      urgency,
      daysUntilStockout,
      supplier: item.supplier,
    });
  }

  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

function computeExpiryRisks(
  inventory: PharmacyInventoryItem[],
  now: Date,
): ExpiryRisk[] {
  const risks: ExpiryRisk[] = [];

  for (const item of inventory) {
    const expiryDate = parseStoreDate(item.expiry);
    if (!expiryDate) continue;

    const daysUntilExpiry = Math.round(
      (expiryDate.getTime() - now.getTime()) / 86_400_000,
    );

    if (daysUntilExpiry <= PROCUREMENT_THRESHOLDS.expiryWarningDays) {
      risks.push({
        itemId: item.id,
        drug: item.drug,
        batch: item.batch,
        expiryDate: item.expiry,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        qty: item.qty,
        financialRisk: Math.round(item.qty * item.price * 100) / 100,
      });
    }
  }

  return risks.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

function computeConsumptionAnomalies(
  inventory: PharmacyInventoryItem[],
  prescriptions: PrescriptionOrder[],
): ConsumptionAnomaly[] {
  if (prescriptions.length === 0 || inventory.length === 0) return [];

  const drugPrescriptionCount: Record<string, number> = {};
  for (const rx of prescriptions) {
    for (const med of rx.meds) {
      const drugKey = med.drug.toLowerCase();
      drugPrescriptionCount[drugKey] = (drugPrescriptionCount[drugKey] || 0) + 1;
    }
  }

  const inventoryByDrug: Record<string, { qty: number; reorder: number; drug: string }> = {};
  for (const item of inventory) {
    const key = item.drug.toLowerCase();
    if (!inventoryByDrug[key]) {
      inventoryByDrug[key] = { qty: 0, reorder: 0, drug: item.drug };
    }
    inventoryByDrug[key].qty += item.qty;
    inventoryByDrug[key].reorder += item.reorder;
  }

  const anomalies: ConsumptionAnomaly[] = [];

  for (const [drugKey, prescriptionCount] of Object.entries(drugPrescriptionCount)) {
    const stock = inventoryByDrug[drugKey];
    if (!stock) {
      anomalies.push({
        drug: drugKey,
        prescriptionCount,
        currentStock: 0,
        riskLevel: 'high',
      });
      continue;
    }

    if (stock.qty <= stock.reorder && prescriptionCount >= 1) {
      let riskLevel: ConsumptionAnomaly['riskLevel'];
      if (stock.qty === 0) {
        riskLevel = 'high';
      } else if (stock.qty <= stock.reorder * 0.5) {
        riskLevel = 'high';
      } else if (stock.qty <= stock.reorder) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      anomalies.push({
        drug: stock.drug,
        prescriptionCount,
        currentStock: stock.qty,
        riskLevel,
      });
    }
  }

  const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return anomalies.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
}

function computeVendorConcentration(
  inventory: PharmacyInventoryItem[],
): VendorConcentration[] {
  if (inventory.length === 0) return [];

  const totalItems = inventory.length;
  const supplierCounts = countBy(inventory, (item) => item.supplier);

  return Object.entries(supplierCounts)
    .map(([supplier, itemCount]) => {
      const percentage = pct(itemCount, totalItems);
      return {
        supplier,
        itemCount,
        percentage,
        isConcentrated: percentage > PROCUREMENT_THRESHOLDS.vendorConcentrationPct,
      };
    })
    .sort((a, b) => b.itemCount - a.itemCount);
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
