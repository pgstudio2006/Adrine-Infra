import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

function openComplianceReport(title: string, body: string) {
  const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:system-ui;margin:32px}h1{font-size:18px}pre{background:#f4f4f5;padding:16px;border-radius:8px;font-size:12px}</style></head>
  <body><h1>${title}</h1><pre>${body}</pre><script>window.onload=()=>window.print()</script></body></html>`;
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function BloodBankCompliance() {
  const nbtcBody = `NBTC Monthly Stock Statement — June 2026
Blood Bank: ADRINE Blood Centre
Licence: BB/HR/2024/1042

Opening stock PRBC: 12 | Issues: 8 | Discards: 1 | Closing: 11
Opening stock FFP: 6 | Issues: 4 | Closing: 5
TTI reactive units quarantined: 1 (HBsAg)
Transfusion reactions reported: 0`;

  const dcaBody = `Drug Control Authority — Form 10 Summary
Period: June 2026
Blood units collected: 24
Components prepared: PRBC 18, FFP 12, Platelets 6
Units issued to wards: 14
Complete audit trail: BB-U-23998 → quarantine (HBsAg reactive)`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance & Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">NBTC, DCA Form 10, and haemovigilance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> NBTC monthly stock statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              National Blood Transfusion Council format — component-wise stock and utilization.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                openComplianceReport("NBTC Monthly Stock Statement", nbtcBody);
                toast.success("NBTC report generated");
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Generate PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Drug Control Authority (Form 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Licence compliance documentation with full chain of custody per unit.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                openComplianceReport("DCA Form 10 Summary", dcaBody);
                toast.success("DCA report generated");
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Generate PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
