import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Circle } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const STAGE_RANK: Record<string, number> = {
  "Pending Analysis": 1,
  "In Analysis": 2,
  "Awaiting Validation": 3,
  "Validated": 4,
  "Reported": 5,
};

const SAMPLE_RANK: Record<string, number> = {
  Ordered: 1,
  Collected: 2,
  Received: 3,
  Processing: 4,
  "Analysis Complete": 5,
};

export default function LabAudit() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const [orderId, setOrderId] = useState("");
  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return labOrders.filter(
      (o) => !q || o.patientName.toLowerCase().includes(q) || o.uhid.toLowerCase().includes(q) || o.orderId.toLowerCase().includes(q),
    );
  }, [labOrders, search]);

  const order = labOrders.find((o) => o.orderId === orderId) ?? null;

  const timeline = useMemo(() => {
    if (!order) return [];
    const sampleRank = SAMPLE_RANK[order.sampleStatus] ?? 0;
    const stageRank = STAGE_RANK[order.stage] ?? 0;
    return [
      { key: "ordered", label: "Order placed", detail: `${order.doctor} · ${order.orderTime}`, done: true },
      { key: "collected", label: "Sample collected", detail: order.sampleId ? `Sample ${order.sampleId}` : "—", done: sampleRank >= 2 },
      { key: "received", label: "Accessioned / received", detail: order.comments ?? "—", done: sampleRank >= 3 },
      { key: "analysis", label: "In analysis", detail: order.methodName ? `Method: ${order.methodName}` : "Bench processing", done: stageRank >= 2 },
      { key: "validation", label: "Awaiting validation", detail: "Pathologist queue", done: stageRank >= 3 },
      { key: "validated", label: "Validated", detail: order.validatedBy ? `By ${order.validatedBy}` : "—", done: stageRank >= 4 },
      { key: "reported", label: "Report released", detail: order.reportedAt ? `${order.reportedAt}${order.authorizedBy ? ` · ${order.authorizedBy}` : ""}` : "—", done: stageRank >= 5 },
    ];
  }, [order]);

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Result audit"
          detail="Per-order lifecycle reconstructed from current order state"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Result audit trail</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reconstructed sample-to-report timeline for any order.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Audit scope</AlertTitle>
        <AlertDescription className="text-xs">
          This timeline is reconstructed from the order's current sample/stage state. A complete per-transition
          history (actor, timestamp, reason) reads from the domain order-transition log when wired (lab W5).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr]">
          <div>
            <Label>Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, UHID, order id…" />
          </div>
          <div>
            <Label>Order</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                {options.slice(0, 50).map((o) => (
                  <SelectItem key={o.orderId} value={o.orderId}>
                    {o.patientName} · {o.tests} ({o.orderId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {order ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {order.patientName} · {order.tests}
              {order.criticalAlert ? <Badge variant="destructive" className="ml-2 text-xs">Critical</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-6">
              {timeline.map((step) => (
                <li key={step.key} className="relative">
                  <span className="absolute -left-[31px] top-0.5">
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <p className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Select an order to view its audit trail.</p>
      )}
    </div>
  );
}
