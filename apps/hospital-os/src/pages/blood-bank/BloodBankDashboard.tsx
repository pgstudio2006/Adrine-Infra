import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Heart, Package, AlertTriangle, Thermometer } from "lucide-react";
import { BLOOD_UNITS, DONORS, REQUISITIONS } from "./bloodBankReferenceData";
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import BloodBankDashboard2026 from './BloodBankDashboard2026';

export default function BloodBankDashboard() {
  if (isAdrine2026Experience()) return <BloodBankDashboard2026 />;
  const available = BLOOD_UNITS.filter((u) => u.status === "Available").length;
  const quarantine = BLOOD_UNITS.filter((u) => u.status === "Quarantine").length;
  const pendingReq = REQUISITIONS.filter((r) => r.status === "Pending").length;
  const eligibleDonors = DONORS.filter((d) => d.eligible).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blood Bank Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete blood lifecycle — donor to transfusion with NBTC-compliant reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Available units</p>
              <p className="text-2xl font-bold">{available}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-500" />
            <div>
              <p className="text-xs text-muted-foreground">Eligible donors</p>
              <p className="text-2xl font-bold">{eligibleDonors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Droplets className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending requisitions</p>
              <p className="text-2xl font-bold">{pendingReq}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Quarantine / TTI hold</p>
              <p className="text-2xl font-bold">{quarantine}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Component stock snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(["PRBC", "FFP", "Platelets"] as const).map((component) => {
              const count = BLOOD_UNITS.filter((u) => u.component === component && u.status === "Available").length;
              return (
                <div key={component} className="flex justify-between text-sm border-b border-border/50 py-2">
                  <span>{component}</span>
                  <Badge variant="outline">{count} units</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4" /> Cold chain monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span>Refrigerator R-01 (PRBC)</span>
              <span className="font-mono text-green-600">4.2°C ✓</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span>Freezer F-01 (FFP)</span>
              <span className="font-mono text-green-600">-28°C ✓</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Platelet agitator P-01</span>
              <span className="font-mono text-green-600">22°C ✓</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
