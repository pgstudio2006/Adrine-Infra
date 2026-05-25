import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Search } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { CriticalResultBanner } from "@/components/diagnostics/CriticalResultBanner";
import { LabGovernedActions } from "@/components/diagnostics/LabGovernedActions";
import { LabWorkflowStepStrip } from "@/components/diagnostics/LabWorkflowStepStrip";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";

export default function LabVerification() {
  const { labOrders, updateLabStage, updateLabOrder } = useHospital();
  useDepartmentWorklistSync("lab");
  const [search, setSearch] = useState("");
  const [validatorName, setValidatorName] = useState("Dr. Pathak");

  const pending = useMemo(
    () => labOrders.filter((o) => o.stage === "Awaiting Validation"),
    [labOrders],
  );
  const readyToRelease = useMemo(
    () => labOrders.filter((o) => o.stage === "Validated"),
    [labOrders],
  );

  const filtered = pending.filter((order) => {
    const q = search.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(q) ||
      order.uhid.toLowerCase().includes(q) ||
      order.orderId.toLowerCase().includes(q)
    );
  });

  const approve = (order: (typeof labOrders)[number]) => {
    updateLabOrder(order.orderId, { validatedBy: validatorName.trim() || "Dr. Pathak" });
    updateLabStage(order.orderId, "Validated");
  };

  const release = (order: (typeof labOrders)[number]) => {
    updateLabStage(order.orderId, "Reported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pathologist validation — verify and release are governed by platform lab lifecycle (GAP-005)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Awaiting Validation</p>
            <p className="text-2xl font-bold text-foreground">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ready to release</p>
            <p className="text-2xl font-bold text-foreground">{readyToRelease.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Critical flags</p>
            <p className="text-2xl font-bold text-foreground">
              {pending.filter((o) => o.criticalAlert || o.platformLabState === "critical_review").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-end max-w-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order, patient, UHID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Validator</Label>
          <Input value={validatorName} onChange={(e) => setValidatorName(e.target.value)} className="h-9" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pending Validation</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No orders awaiting validation.</p>
        ) : (
          filtered.map((order) => (
            <Card
              key={order.orderId}
              className={`border-border ${order.criticalAlert || order.platformLabState === "critical_review" ? "border-l-4 border-l-destructive" : ""}`}
            >
              <CardHeader className="pb-3 space-y-3">
                {(order.criticalAlert || order.platformLabState === "critical_review") && (
                  <CriticalResultBanner
                    patientName={order.patientName}
                    orderId={order.orderId}
                    platformCritical={order.platformLabState === "critical_review"}
                  />
                )}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="font-mono">{order.orderId}</span>
                      <WorklistStatusChip label={order.stage} tone="secondary" />
                    </CardTitle>
                    <p className="text-sm text-foreground">
                      {order.patientName}{" "}
                      <span className="text-muted-foreground">· {order.uhid} · {order.category}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{order.tests}</p>
                    <LabWorkflowStepStrip order={order} />
                  </div>
                  <LabGovernedActions
                    platformLabState={order.platformLabState}
                    localStage={order.stage}
                    hasResults={!!order.results?.trim()}
                    onVerify={() => approve(order)}
                    onRelease={() => release(order)}
                    showRelease={false}
                    showVerify
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap bg-muted/30">
                  {order.results?.trim() || "No result summary entered — complete entry before validation."}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {readyToRelease.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Ready to release</h2>
          {readyToRelease.map((order) => (
            <Card key={order.orderId} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base font-mono">{order.orderId}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.patientName} · {order.uhid}</p>
                    <LabWorkflowStepStrip order={order} className="mt-2" />
                  </div>
                  <LabGovernedActions
                    platformLabState={order.platformLabState}
                    localStage={order.stage}
                    hasResults={!!order.results?.trim()}
                    onVerify={() => approve(order)}
                    onRelease={() => release(order)}
                    showVerify={false}
                    showRelease
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
