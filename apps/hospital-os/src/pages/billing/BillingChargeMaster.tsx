import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Plus, Search } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import {
  canUseFinanceRuntime,
  platformGetBillingChargeMaster,
  type PlatformChargeMasterItem,
} from '@/runtime/finance-runtime';

type ChargeType = 'room' | 'procedure' | 'consultation' | 'pharmacy' | 'lab' | 'radiology' | 'misc';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function BillingChargeMaster() {
  const [charges, setCharges] = useState<PlatformChargeMasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ChargeType | 'all'>('all');
  const [search, setSearch] = useState('');
  const platformOn = canUseFinanceRuntime();

  const refresh = useCallback(async () => {
    if (!platformOn) {
      setCharges([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await platformGetBillingChargeMaster();
      setCharges(response.charges);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load charge master');
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [platformOn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return charges.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.code.toLowerCase().includes(search.toLowerCase()) &&
        !c.hsnSac.includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [charges, typeFilter, search]);

  const totalActive = charges.filter((c) => c.status === 'active').length;

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PlatformConnectivityStrip
        label="Charge master"
        detail={platformOn ? `${charges.length} governed tariffs from domain-api` : 'Enable platform runtime for live charge catalog'}
        error={error}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Charge Master
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${totalActive} active charges · ${charges.length} total`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Charge
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'room', 'procedure', 'consultation', 'pharmacy', 'lab', 'radiology', 'misc'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === t ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="h-9 w-56 rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Search code, name, HSN/SAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <PlatformEmptyState message="No charge master rows yet. Connect platform runtime to load governed tariffs from /billing/dept/charge-master." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium">Code</th>
                <th className="px-3 py-2.5 text-left font-medium">Name</th>
                <th className="px-3 py-2.5 text-left font-medium">Type</th>
                <th className="px-3 py-2.5 text-left font-medium">HSN/SAC</th>
                <th className="px-3 py-2.5 text-right font-medium">Base Rate (₹)</th>
                <th className="px-3 py-2.5 text-center font-medium">Status</th>
                <th className="px-3 py-2.5 text-center font-medium">Package</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-xs">{c.code}</td>
                  <td className="px-3 py-2.5 font-medium">{c.name}</td>
                  <td className="px-3 py-2.5 capitalize">{c.type}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{c.hsnSac}</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{c.baseRate.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center capitalize">{c.status}</td>
                  <td className="px-3 py-2.5 text-center">{c.packageFlag ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
