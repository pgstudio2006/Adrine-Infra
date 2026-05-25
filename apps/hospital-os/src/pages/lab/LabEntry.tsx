import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beaker, Search } from "lucide-react";
import { useHospital, type LabOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { LabWorkflowStepStrip } from "@/components/diagnostics/LabWorkflowStepStrip";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";

export default function LabEntry() {
  const { labOrders, updateLabOrder, updateLabStage } = useHospital();
  const [search, setSearch] = useState("");

  useDepartmentWorklistSync("lab");

  const entryOrders = useMemo(
    () =>
      labOrders.filter(
        (o) =>
          o.sampleStatus === "Received" ||
          o.sampleStatus === "Processing" ||
          o.stage === "In Analysis" ||
          o.stage === "Awaiting Validation",
      ),
    [labOrders],
  );

  const filtered = entryOrders.filter((order) => {
    const q = search.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(q) ||
      order.uhid.toLowerCase().includes(q) ||
      order.orderId.toLowerCase().includes(q) ||
      order.tests.toLowerCase().includes(q)
    );
  });

  const markReceived = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Received" });
  };

  const startAnalysis = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Processing" });
    updateLabStage(order.orderId, "In Analysis");
  };

  const submitForValidation = (order: LabOrder) => {
    if (!order.results?.trim()) {
      return;
    }
    updateLabOrder(order.orderId, { sampleStatus: "Analysis Complete" });
    updateLabStage(order.orderId, "Awaiting Validation");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Test Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sample → Verify → Report — enter results on received samples; governed transitions sync when platform runtime is on
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search order, patient, UHID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground text-center">
            No orders ready for result entry. Mark samples received from the worklist first.
          </CardContent>
        </Card>
      )}

      {filtered.map((order) => (
        <Card key={order.orderId} className="border-border">
          <CardHeader className="pb-3 space-y-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              <span className="font-mono">{order.orderId}</span>
              <WorklistStatusChip label={order.stage} tone="outline" />
            </CardTitle>
            <p className="text-sm text-foreground">
              {order.patientName}{" "}
              <span className="text-muted-foreground">· {order.uhid} · {order.tests}</span>
            </p>
            <LabWorkflowStepStrip order={order} />
            <div className="flex gap-2 flex-wrap pt-1">
              {order.sampleStatus === "Collected" && (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markReceived(order)}>
                  Mark received
                </Button>
              )}
              {(order.sampleStatus === "Received" || order.sampleStatus === "Ordered") && (
                <Button size="sm" className="text-xs h-7" onClick={() => startAnalysis(order)}>
                  Start analysis
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Result summary</label>
                <Input
                  className="font-mono text-sm"
                  value={order.results || ""}
                  placeholder="Enter result text or values"
                  onChange={(e) => updateLabOrder(order.orderId, { results: e.target.value })}
                />
              </div>
              <Button
                size="sm"
                disabled={!order.results?.trim()}
                onClick={() => submitForValidation(order)}
              >
                Submit for validation
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample: {order.sampleStatus} · Priority: {order.priority}
              {order.criticalAlert ? " · Platform critical flag" : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
