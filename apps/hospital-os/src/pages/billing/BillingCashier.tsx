import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { useBillingDeptPlatform } from '@/hooks/useBillingDeptPlatform';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function BillingCashier() {
  const { platformOn, storePayments } = useBillingDeptPlatform();
  const [modeFilter, setModeFilter] = useState<string>('all');

  const txns = useMemo(
    () =>
      storePayments.map((payment) => ({
        id: payment.id,
        receiptNo: payment.reference ?? payment.id,
        patientName: payment.patient,
        type: payment.type === 'Refund' ? 'refund' : payment.type === 'Advance' ? 'advance' : 'payment',
        mode: payment.method.toLowerCase().replace(' ', '-'),
        amount: payment.amount,
        refNo: payment.reference ?? '',
        timestamp: payment.date,
        status: payment.status === 'Completed' ? 'completed' : 'voided',
      })),
    [storePayments],
  );

  const filtered = useMemo(() => {
    if (modeFilter === 'all') return txns;
    return txns.filter((t) => t.mode === modeFilter);
  }, [txns, modeFilter]);

  const totalCollection = txns
    .filter((t) => t.type === 'payment' || t.type === 'advance')
    .reduce((s, t) => s + t.amount, 0);
  const totalRefunds = txns.filter((t) => t.type === 'refund').reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PlatformConnectivityStrip
        label="Cashier desk"
        detail={`${txns.length} transactions from live billing store · ${platformOn ? 'platform authoritative' : 'local store'}`}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Cashier
          </h1>
          <p className="text-sm text-muted-foreground">{txns.length} transactions</p>
        </div>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
          <Plus className="h-4 w-4" /> New Receipt
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Collection</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">₹{totalCollection.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Refunds</div>
          <div className="mt-1 text-lg font-bold text-red-600">₹{totalRefunds.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Net</div>
          <div className="mt-1 text-lg font-bold">₹{(totalCollection - totalRefunds).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Transactions</div>
          <div className="mt-1 text-lg font-bold">{txns.length}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {['all', 'cash', 'card', 'upi', 'bank-transfer', 'cheque'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModeFilter(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              modeFilter === m ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <PlatformEmptyState message="No cashier transactions yet for this branch." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium">Receipt No</th>
                <th className="px-3 py-2.5 text-left font-medium">Patient</th>
                <th className="px-3 py-2.5 text-left font-medium">Type</th>
                <th className="px-3 py-2.5 text-left font-medium">Mode</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount (₹)</th>
                <th className="px-3 py-2.5 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-xs">{t.receiptNo}</td>
                  <td className="px-3 py-2.5">{t.patientName}</td>
                  <td className="px-3 py-2.5 capitalize">{t.type}</td>
                  <td className="px-3 py-2.5 capitalize">{t.mode.replace('-', ' ')}</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{t.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{t.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
