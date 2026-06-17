import { useState } from 'react';
import { ArrowLeft, CreditCard, IndianRupee, CheckCircle, Receipt, Smartphone, Wallet } from 'lucide-react';

const DEMO_INVOICES = [
  { id: 'INV-001', patient: 'Priya Sharma', uhid: 'UH-2026-001', study: 'MRI Brain', amount: 8000, paid: 8000, method: 'UPI', status: 'paid', date: '2026-06-17' },
  { id: 'INV-002', patient: 'Rajesh Kumar', uhid: 'UH-2026-002', study: 'CT Chest with Contrast', amount: 4500, paid: 0, method: '', status: 'pending', date: '2026-06-17' },
  { id: 'INV-003', patient: 'Anita Desai', uhid: 'UH-2026-003', study: 'X-Ray Knee', amount: 350, paid: 200, method: 'Cash', status: 'partial', date: '2026-06-16' },
];

const METHODS = [
  { key: 'cash', label: 'Cash', icon: IndianRupee, color: '#00C853' },
  { key: 'upi', label: 'UPI', icon: Smartphone, color: '#6366f1' },
  { key: 'card', label: 'Card', icon: CreditCard, color: '#2196F3' },
  { key: 'credit', label: 'Credit', icon: Wallet, color: '#FFB300' },
];

const statusColor: Record<string, string> = {
  paid: 'bg-[#00C853]/10 text-[#00C853]',
  pending: 'bg-[#E53935]/10 text-[#E53935]',
  partial: 'bg-[#FFB300]/10 text-[#FFB300]',
};

export default function RisBilling() {
  const [tab, setTab] = useState<'invoices' | 'new'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof DEMO_INVOICES[0] | null>(null);
  const [payMethod, setPayMethod] = useState('upi');
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(false);

  const totalPending = DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount - i.paid, 0);
  const totalCollected = DEMO_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing</h1>
          <p className="text-sm text-white/40 mt-0.5">Radiology service billing and payment tracking</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Pending</p>
          <p className="text-lg font-bold text-[#E53935]">₹{(totalPending / 100).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Collected Today</p>
          <p className="text-lg font-bold text-[#00C853]">₹{(totalCollected / 100).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Invoices</p>
          <p className="text-lg font-bold text-white">{DEMO_INVOICES.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['invoices', 'new'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-[#E53935] text-white' : 'bg-[#151922] text-white/50 hover:text-white/70'}`}>
            {t === 'invoices' ? 'Invoices' : 'New Invoice'}
          </button>
        ))}
      </div>

      {tab === 'invoices' ? (
        <div className="space-y-2">
          {DEMO_INVOICES.map(inv => (
            <div key={inv.id} onClick={() => { setSelectedInvoice(inv); setPaid(false); }}
              className="bg-[#151922] rounded-xl border border-white/5 p-4 cursor-pointer hover:border-white/15 transition-all">
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-white/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white">{inv.patient}</p>
                    <span className="text-[9px] font-mono text-white/30">{inv.uhid}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${statusColor[inv.status]}`}>{inv.status}</span>
                  </div>
                  <p className="text-[10px] text-white/40">{inv.study} · {inv.id} · {inv.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</p>
                  {inv.paid > 0 && inv.paid < inv.amount && (
                    <p className="text-[10px] text-[#FFB300]">Paid: ₹{inv.paid.toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-6 space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">New Invoice</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Patient / UHID</label>
              <input className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50" placeholder="Search patient..." />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Study</label>
              <input className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50" placeholder="Linked study" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Amount (₹)</label>
              <input type="number" className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Discount (₹)</label>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Tax (₹)</label>
              <input type="number" defaultValue={0} className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Payment Mode</p>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(m => (
                <button key={m.key} onClick={() => setPayMethod(m.key)}
                  className={`h-16 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all ${
                    payMethod === m.key ? 'border-2 text-white' : 'bg-[#0F1115] border border-white/10 text-white/40 hover:text-white/60'
                  }`} style={payMethod === m.key ? { borderColor: m.color, backgroundColor: `${m.color}15`, color: m.color } : {}}>
                  <m.icon className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="w-full h-10 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d32f2f] transition-colors">
            <Receipt className="h-3.5 w-3.5" />Generate Invoice
          </button>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelectedInvoice(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#0F1115] rounded-xl border border-white/10 p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Invoice {selectedInvoice.id}</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-white/40 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-white/40">Patient</span><span className="text-white">{selectedInvoice.patient}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Study</span><span className="text-white">{selectedInvoice.study}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="text-white font-bold">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span></div>
              {selectedInvoice.paid > 0 && <div className="flex justify-between"><span className="text-white/40">Paid</span><span className="text-[#00C853]">₹{selectedInvoice.paid.toLocaleString('en-IN')}</span></div>}
            </div>
            {selectedInvoice.status !== 'paid' && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {METHODS.map(m => (
                    <button key={m.key} onClick={() => setPayMethod(m.key)}
                      className={`h-12 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all ${
                        payMethod === m.key ? 'border-2' : 'bg-[#151922] border border-white/10 text-white/40'
                      }`} style={payMethod === m.key ? { borderColor: m.color, backgroundColor: `${m.color}15`, color: m.color } : {}}>
                      <m.icon className="h-4 w-4" />{m.label}
                    </button>
                  ))}
                </div>
                {!paid ? (
                  <button onClick={() => setPaid(true)} className="w-full h-9 rounded-lg bg-[#00C853] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#00b848] transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" />Mark as Paid
                  </button>
                ) : (
                  <div className="text-center py-3 text-[#00C853] text-sm font-semibold">✓ Payment recorded</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
