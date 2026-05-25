import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Complaint } from './ConsultationComplaints';
import type { Diagnosis } from './ConsultationDiagnosis';
import type { Medication } from './ConsultationMedications';
import type { LabTest, RadiologyOrder } from './ConsultationOrders';

interface PrescriptionData {
  patientName: string;
  patientAge: number;
  patientGender: string;
  uhid: string;
  phone?: string;
  doctorName: string;
  doctorQualification?: string;
  department: string;
  regNo?: string;
  vitals: { bp: string; pulse: string; weight: string; temp: string; spo2: string };
  complaints: Complaint[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  labTests: LabTest[];
  radiologyOrders: RadiologyOrder[];
  advice: string;
  followUpDays: string;
  followUpUnit: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: PrescriptionData;
}

export default function PrescriptionPreview({ open, onClose, data }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${data.patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
          .hospital-name { font-size: 26px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; }
          .hospital-info { font-size: 11px; color: #555; margin-top: 4px; }
          .doctor-info { text-align: right; }
          .doctor-name { font-size: 18px; font-weight: 700; }
          .doctor-qual { font-size: 12px; color: #555; }
          .divider { border: none; border-top: 2.5px solid #1a1a1a; margin: 12px 0; }
          .divider-thin { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .patient-box { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px; }
          .patient-row { display: flex; gap: 24px; }
          .patient-field label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
          .patient-field p { font-size: 13px; font-weight: 600; }
          .vitals-row { display: flex; gap: 32px; padding: 8px 16px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 6px 6px; background: #fafafa; }
          .vital-item { font-size: 12px; color: #555; }
          .vital-item strong { color: #1a1a1a; }
          .content-area { display: grid; grid-template-columns: 1fr 1.3fr; gap: 32px; margin-top: 20px; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .section-list { list-style-type: disc; padding-left: 18px; font-size: 13px; line-height: 1.8; }
          .rx-header { font-size: 28px; font-weight: 700; font-style: italic; font-family: 'Times New Roman', serif; margin-bottom: 4px; }
          .rx-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 12px; }
          .med-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .med-table th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; padding: 6px 8px; border-bottom: 1px solid #ddd; }
          .med-table td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
          .med-name { font-weight: 600; }
          .med-type { font-size: 10px; color: #888; }
          .advice-box { border: 1px solid #4da6ff; border-radius: 6px; padding: 12px 16px; margin-top: 16px; background: #f0f8ff; }
          .advice-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a5f; margin-bottom: 6px; }
          .advice-text { font-size: 12px; line-height: 1.6; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
          .followup { font-size: 13px; }
          .followup strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .signature { text-align: right; }
          .sig-line { width: 180px; border-top: 1px solid #1a1a1a; margin-left: auto; margin-bottom: 4px; }
          .sig-label { font-size: 12px; color: #555; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">Prescription Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div ref={printRef}>
            {/* Hospital Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  ADRINE HOSPITAL
                </div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                  📍 S.G. Highway, Ahmedabad, Gujarat<br />
                  📞 +91 79 1234 5678 &nbsp;&nbsp; ✉ info@adrinehospital.com
                </div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{data.doctorName}</div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {data.doctorQualification || 'MBBS, MD (Cardiology)'}<br />
                  {data.department}<br />
                  Reg. No: {data.regNo || 'G-12345'}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2.5px solid #1a1a1a', margin: '12px 0' }} />

            {/* Patient Info */}
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: '12px 16px', marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888' }}>Patient Name</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{data.patientName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888' }}>Age / Gender</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{data.patientAge}Y / {data.patientGender}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888' }}>Patient ID</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{data.uhid}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888' }}>Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{today}</div>
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div style={{ display: 'flex', gap: 32, padding: '8px 16px', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fafafa' }}>
              <div style={{ fontSize: 12, color: '#555' }}>BP: <strong style={{ color: '#1a1a1a' }}>{data.vitals.bp}</strong></div>
              <div style={{ fontSize: 12, color: '#555' }}>Pulse: <strong style={{ color: '#1a1a1a' }}>{data.vitals.pulse} bpm</strong></div>
              <div style={{ fontSize: 12, color: '#555' }}>Weight: <strong style={{ color: '#1a1a1a' }}>{data.vitals.weight} kg</strong></div>
              <div style={{ fontSize: 12, color: '#555' }}>Temp: <strong style={{ color: '#1a1a1a' }}>{data.vitals.temp}°F</strong></div>
              <div style={{ fontSize: 12, color: '#555' }}>SpO2: <strong style={{ color: '#1a1a1a' }}>{data.vitals.spo2}%</strong></div>
            </div>

            {/* Content: Left clinical + Right Rx */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 32, marginTop: 20 }}>
              {/* Left */}
              <div>
                {data.complaints.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Chief Complaints</div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                      {data.complaints.map(c => <li key={c.id}>{c.text}{c.duration ? ` (${c.duration})` : ''}</li>)}
                    </ul>
                  </div>
                )}

                {data.diagnoses.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Diagnosis</div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                      {data.diagnoses.map(d => <li key={d.id}>{d.text}{d.code ? ` (${d.code})` : ''}</li>)}
                    </ul>
                  </div>
                )}

                {data.labTests.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Lab Investigations</div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                      {data.labTests.map(t => <li key={t.id}>{t.text}</li>)}
                    </ul>
                  </div>
                )}

                {data.radiologyOrders.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Radiology</div>
                    <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                      {data.radiologyOrders.map(r => <li key={r.id}>{r.type} - {r.bodyPart}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right - Medications */}
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, fontStyle: 'italic', fontFamily: "'Times New Roman', serif" }}>Rx</div>
                <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#888', marginBottom: 12 }}>MEDICATIONS</div>

                {data.medications.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' as const, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888', padding: '6px 8px', borderBottom: '1px solid #ddd' }}>Medicine Name</th>
                        <th style={{ textAlign: 'left' as const, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888', padding: '6px 8px', borderBottom: '1px solid #ddd' }}>Dosage</th>
                        <th style={{ textAlign: 'left' as const, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888', padding: '6px 8px', borderBottom: '1px solid #ddd' }}>Frequency</th>
                        <th style={{ textAlign: 'left' as const, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#888', padding: '6px 8px', borderBottom: '1px solid #ddd' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.medications.map(m => (
                        <tr key={m.id}>
                          <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>{m.route}</div>
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                            {m.dosage}
                            {m.instructions && <div style={{ fontSize: 10, color: '#888' }}>{m.instructions}</div>}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{m.frequency}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>No medications prescribed</div>
                )}

                {/* Advice box */}
                {data.advice && (
                  <div style={{ border: '1px solid #4da6ff', borderRadius: 6, padding: '12px 16px', marginTop: 16, background: '#f0f8ff' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#1e3a5f', marginBottom: 6 }}>Advice / Instructions</div>
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>{data.advice}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '24px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 13 }}>
                <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 2 }}>Follow Up:</strong>
                {data.followUpDays} {data.followUpUnit}
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ width: 180, borderTop: '1px solid #1a1a1a', marginLeft: 'auto', marginBottom: 4 }} />
                <div style={{ fontSize: 12, color: '#555' }}>Doctor's Signature</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
