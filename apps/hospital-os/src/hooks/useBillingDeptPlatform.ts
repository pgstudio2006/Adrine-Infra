import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHospital, type BillingInvoice } from '@/stores/hospitalStore';
import {
  canUseBillingRuntime,
  platformGetLiveFinancialState,
  platformGetLiveIpdFinancialState,
  type LiveFinancialState,
  type LiveIpdFinancialState,
} from '@/runtime/billing-runtime';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import { getBillingPageBanner, type BillingPageBanner } from '@/config/routeReadiness';

export function useBillingDeptPlatform() {
  const { invoices, billingTransactions, patients, admissions, collectPayment } = useHospital();
  const platformOn = isPlatformAuthoritative() && canUseBillingRuntime();

  const storeInvoices = useMemo(() => invoices, [invoices]);
  const storePayments = useMemo(
    () =>
      billingTransactions.map((tx) => ({
        id: tx.id,
        billId: tx.invoiceId,
        uhid: tx.uhid,
        patient: tx.patientName,
        date: tx.createdAt,
        amount: tx.amount,
        method: (tx.mode === 'card'
          ? 'Card'
          : tx.mode === 'upi'
            ? 'UPI'
            : tx.mode === 'bank-transfer'
              ? 'Bank Transfer'
              : tx.mode === 'cheque'
                ? 'Cheque'
                : 'Cash') as 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Insurance',
        status: 'Completed' as const,
        type: (tx.kind === 'refund' ? 'Refund' : 'Payment') as 'Payment' | 'Advance' | 'Refund',
        reference: tx.reference,
      })),
    [billingTransactions],
  );

  const resolveOpdVisitId = useCallback(
    (uhid: string) => patients.find((p) => p.uhid === uhid)?.platformOpdVisitId,
    [patients],
  );

  const resolvePlatformAdmissionId = useCallback(
    (uhid: string) =>
      admissions.find((a) => a.uhid === uhid && a.platformAdmissionId)?.platformAdmissionId,
    [admissions],
  );

  return {
    platformOn,
    storeInvoices,
    storePayments,
    collectPayment,
    resolveOpdVisitId,
    resolvePlatformAdmissionId,
    patients,
    admissions,
  };
}

/** Page-level banner mode for current billing-dept route. */
export function useBillingPageBanner(): BillingPageBanner | null {
  const { pathname } = useLocation();
  const { platformOn } = useBillingDeptPlatform();
  return getBillingPageBanner(pathname, platformOn);
}

/** Live OPD financial snapshot for a selected invoice row. */
export function useOpdLiveFinancial(opdVisitId: string | undefined) {
  const [state, setState] = useState<LiveFinancialState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!opdVisitId || !canUseBillingRuntime()) {
      setState(null);
      return;
    }
    try {
      const data = await platformGetLiveFinancialState(opdVisitId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load live billing');
    }
  }, [opdVisitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, error, refresh, blockers: state?.blockers ?? [] };
}

/** Live IPD financial snapshot for billing-dept IPD screens. */
export function useIpdLiveFinancial(platformAdmissionId: string | undefined) {
  const [state, setState] = useState<LiveIpdFinancialState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!platformAdmissionId || !canUseBillingRuntime()) {
      setState(null);
      return;
    }
    try {
      const data = await platformGetLiveIpdFinancialState(platformAdmissionId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load IPD billing');
    }
  }, [platformAdmissionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, error, refresh, blockers: state?.blockers ?? [] };
}

/** Aggregates from hospitalStore for dashboard / reports when platform runtime is on. */
export function useBillingStoreAggregates() {
  const { platformOn, storeInvoices, storePayments } = useBillingDeptPlatform();

  return useMemo(() => {
    const totalCollected = storePayments
      .filter((p) => p.status === 'Completed' && p.type !== 'Refund')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingInvoices = storeInvoices.filter(
      (inv) => inv.status !== 'paid' && inv.total > inv.paid,
    );
    const totalOutstanding = pendingInvoices.reduce(
      (sum, inv) => sum + Math.max(0, inv.total - inv.paid),
      0,
    );

    const revenueByCategory = storeInvoices.reduce<Record<string, number>>((acc, inv) => {
      const key = inv.category;
      acc[key] = (acc[key] ?? 0) + inv.total;
      return acc;
    }, {});

    const collectionsByMethod = storePayments.reduce<
      Record<string, { count: number; amount: number }>
    >((acc, p) => {
      if (p.type === 'Refund') return acc;
      const method = p.method;
      if (!acc[method]) acc[method] = { count: 0, amount: 0 };
      acc[method].count += 1;
      acc[method].amount += p.amount;
      return acc;
    }, {});

    const outstandingBills = pendingInvoices.map((inv) => ({
      patient: inv.patientName,
      uhid: inv.uhid,
      billId: inv.id,
      amount: Math.max(0, inv.total - inv.paid),
      category: inv.category,
    }));

    const recentTransactions = storePayments.slice(0, 8).map((p) => ({
      id: p.id,
      patient: p.patient,
      uhid: p.uhid,
      type: storeInvoices.find((i) => i.id === p.billId)?.category ?? 'OPD',
      amount: p.amount,
      method: p.method,
      status: p.type === 'Refund' ? 'Refunded' : 'Paid',
      time: p.date,
    }));

    return {
      platformOn,
      totalCollected,
      pendingBillCount: pendingInvoices.length,
      totalOutstanding,
      invoiceCount: storeInvoices.length,
      revenueByCategory,
      collectionsByMethod,
      outstandingBills,
      recentTransactions,
    };
  }, [platformOn, storeInvoices, storePayments]);
}

export function mapStoreInvoiceStatus(inv: BillingInvoice): {
  status: 'Draft' | 'Finalized' | 'Sent' | 'Paid' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Refunded';
} {
  const paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Refunded' =
    inv.status === 'paid'
      ? 'Paid'
      : inv.status === 'partial'
        ? 'Partial'
        : 'Pending';
  const status: 'Draft' | 'Finalized' | 'Sent' | 'Paid' | 'Cancelled' =
    inv.status === 'paid'
      ? 'Paid'
      : inv.status === 'partial'
        ? 'Sent'
        : inv.finalized
          ? 'Finalized'
          : 'Draft';
  return { status, paymentStatus };
}
