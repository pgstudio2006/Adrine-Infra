import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, ArrowLeft } from 'lucide-react';

export default function RisNewPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', age: '', gender: '', dob: '', mobile: '', email: '',
    address: '', referringDoctor: '', department: '', clinicalNotes: '', symptoms: '',
  });
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate('/orders'), 1200);
  };

  if (saved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-[#00C853]/10 flex items-center justify-center mx-auto">
            <UserPlus className="h-8 w-8 text-[#00C853]" />
          </div>
          <p className="text-lg font-bold text-[var(--c-text)]">Patient Registered</p>
          <p className="text-xs text-[var(--c-text-secondary)]">Redirecting to order creation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] flex items-center justify-center hover:bg-[var(--c-surface-hover)]">
          <ArrowLeft className="h-4 w-4 text-[var(--c-text)]/50" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">New Patient Registration</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Register a new imaging patient</p>
        </div>
      </div>

      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-6 space-y-5">
        {/* Patient Details */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Patient Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'fullName', label: 'Full Name', type: 'text', required: true },
              { key: 'age', label: 'Age', type: 'number' },
              { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
              { key: 'dob', label: 'Date of Birth', type: 'date' },
              { key: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
              { key: 'email', label: 'Email', type: 'email' },
            ].map(f => (
              <div key={f.key} className={f.key === 'fullName' || f.key === 'mobile' ? 'sm:col-span-2' : ''}>
                <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">{f.label}{f.required && <span className="text-[var(--c-accent)] ml-0.5">*</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)}
                    className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none focus:border-[var(--c-accent)]/50">
                    <option value="">Select</option>
                    {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)}
                    className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Address</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
              className="w-full rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 py-2 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50 resize-none" />
          </div>
        </div>

        {/* Referral Details */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Referral Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Referring Doctor</label>
              <input type="text" value={form.referringDoctor} onChange={e => set('referringDoctor', e.target.value)}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Department</label>
              <input type="text" value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
          </div>
        </div>

        {/* Clinical Details */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Clinical Details</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Symptoms</label>
              <input type="text" value={form.symptoms} onChange={e => set('symptoms', e.target.value)}
                placeholder="e.g. Headache, back pain, chest discomfort..."
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Clinical Notes</label>
              <textarea value={form.clinicalNotes} onChange={e => set('clinicalNotes', e.target.value)} rows={3}
                placeholder="Additional clinical history, provisional diagnosis..."
                className="w-full rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 py-2 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50 resize-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={() => navigate(-1)} className="h-9 px-4 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text-secondary)] text-xs font-medium hover:bg-[var(--c-surface-hover)] transition-colors">Cancel</button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--c-accent)] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--c-accent-hover)] transition-colors">
            <Save className="h-3.5 w-3.5" />Save & Create Order
          </button>
        </div>
      </div>
    </div>
  );
}
