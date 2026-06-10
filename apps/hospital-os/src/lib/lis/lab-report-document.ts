export type LabReportPayload = {
  labName: string;
  orderId: string;
  patientName: string;
  uhid: string;
  ageGender?: string;
  specimenType: string;
  methodName: string;
  collectedAt?: string;
  reportedAt: string;
  results: string;
  interpretation: string;
  comments: string;
  authorizedBy: string;
  machineSource?: string;
};

export function openLabReportPrintWindow(payload: LabReportPayload): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lab Report ${payload.orderId}</title>
  <style>
    body { font-family: Georgia, serif; margin: 32px; color: #111; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 22px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-bottom: 20px; }
    .results { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 13px; background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .section { margin-top: 16px; }
    .section h3 { font-size: 14px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
    .sign { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 13px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${payload.labName}</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#64748b">Laboratory Investigation Report · ${payload.reportedAt}</p>
  </div>
  <div class="meta">
    <div><strong>Patient:</strong> ${payload.patientName}</div>
    <div><strong>UHID:</strong> ${payload.uhid}</div>
    <div><strong>Order ID:</strong> ${payload.orderId}</div>
    <div><strong>Specimen:</strong> ${payload.specimenType}</div>
    <div><strong>Method:</strong> ${payload.methodName}</div>
    ${payload.machineSource ? `<div><strong>Instrument:</strong> ${payload.machineSource}</div>` : ''}
    ${payload.ageGender ? `<div><strong>Age/Gender:</strong> ${payload.ageGender}</div>` : ''}
  </div>
  <div class="section">
    <h3>Results</h3>
    <div class="results">${escapeHtml(payload.results || '—')}</div>
  </div>
  ${payload.interpretation ? `<div class="section"><h3>Interpretation</h3><p>${escapeHtml(payload.interpretation)}</p></div>` : ''}
  ${payload.comments ? `<div class="section"><h3>Comments</h3><p>${escapeHtml(payload.comments)}</p></div>` : ''}
  <div class="sign">
  <p><strong>Electronically signed by:</strong> ${escapeHtml(payload.authorizedBy)}</p>
  <p style="color:#64748b;font-size:12px">This is a computer-generated report from Adrine LIS middleware. No manual transcription.</p>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
