import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BLOOD_UNITS } from "./bloodBankReferenceData";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Available: "default",
  Reserved: "secondary",
  Quarantine: "destructive",
  Issued: "outline",
  Expired: "destructive",
};

export default function BloodBankInventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory & Components</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unit-wise stock, TTI clearance, component separation, and expiry alerts.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blood units</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>TTI panel</TableHead>
                <TableHead>Temp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BLOOD_UNITS.map((unit) => (
                <TableRow key={unit.unitId}>
                  <TableCell className="font-mono text-sm">{unit.unitId}</TableCell>
                  <TableCell><Badge variant="outline">{unit.bloodGroup}</Badge></TableCell>
                  <TableCell className="text-sm">{unit.component}</TableCell>
                  <TableCell className="text-sm">{unit.expiryDate}</TableCell>
                  <TableCell className="text-xs">
                    HIV {unit.tti.hiv} · HBsAg {unit.tti.hbsag}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{unit.temperatureC}°C</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[unit.status]} className="text-xs">{unit.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
