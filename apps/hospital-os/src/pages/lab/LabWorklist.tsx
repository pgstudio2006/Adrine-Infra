import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, FlaskConical, ListChecks, Search } from "lucide-react";
import { useHospital, type LabOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { CriticalResultBanner } from "@/components/diagnostics/CriticalResultBanner";
import { LabGovernedActions } from "@/components/diagnostics/LabGovernedActions";
import { LabWorkflowStepStrip } from "@/components/diagnostics/LabWorkflowStepStrip";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";

const priorityTone = (priority: LabOrder["priority"]) => {
  if (priority === "Emergency") return "destructive" as const;
  if (priority === "Urgent") return "default" as const;
  return "outline" as const;
};

const stageTone = (stage: LabOrder["stage"]) => {
  if (stage === "Reported") return "default" as const;
  if (stage === "Validated" || stage === "Awaiting Validation") return "secondary" as const;
  return "outline" as const;
};

export default function LabWorklist() {
  const { labOrders, invoices, updateLabStage, updateLabOrder } = useHospital();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [resultsDraft, setResultsDraft] = useState("");
  const [validatorName, setValidatorName] = useState("Dr. Pathak");

  useDepartmentWorklistSync("lab");

  const selectedOrder = labOrders.find((order) => order.orderId === selectedOrderId) || null;

  const billingByUhid = useMemo(() => {
    const map = new Map<string, { paid: number; due: number }>();
    invoices.forEach((invoice) => {
      const current = map.get(invoice.uhid) || { paid: 0, due: 0 };
      current.paid += invoice.paid;
      current.due += Math.max(0, invoice.total - invoice.paid);
      map.set(invoice.uhid, current);
    });
    return map;
  }, [invoices]);

  const activeOrders = useMemo(
    () => labOrders.filter((order) => order.stage !== "Reported"),
    [labOrders],
  );
  const delayedOrders = useMemo(
    () => labOrders.filter((order) => order.sampleStatus === "Ordered" || order.sampleStatus === "Collected"),
    [labOrders],
  );

  const filteredOrders = activeOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(search.toLowerCase()) ||
      order.uhid.toLowerCase().includes(search.toLowerCase()) ||
      order.orderId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || order.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const openOrder = (order: LabOrder) => {
    setSelectedOrderId(order.orderId);
    setResultsDraft(order.results || "");
    setValidatorName(order.validatedBy || "Dr. Pathak");
  };

  const markSampleReceived = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Received" });
  };

  const startAnalysis = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Processing" });
    updateLabStage(order.orderId, "In Analysis");
  };

  const saveResults = () => {
    if (!selectedOrder) return;
    updateLabOrder(selectedOrder.orderId, {
      results: resultsDraft.trim(),
      sampleStatus: "Analysis Complete",
    });
    updateLabStage(selectedOrder.orderId, "Awaiting Validation");
  };

  const validateOrder = () => {
    if (!selectedOrder) return;
    updateLabOrder(selectedOrder.orderId, {
      validatedBy: validatorName.trim() || "Dr. Pathak",
    });
    updateLabStage(selectedOrder.orderId, "Validated");
  };

  const releaseReport = () => {
    if (!selectedOrder) return;
    updateLabStage(selectedOrder.orderId, "Reported");
    setSelectedOrderId(null);
  };

  const worklistColumns = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: (order: LabOrder) => (
          <div className="space-y-1">
            <WorklistStatusChip label={order.stage} tone={stageTone(order.stage)} />
            <WorklistStatusChip label={order.sampleStatus} tone="outline" />
          </div>
        ),
      },
      {
        id: "patient",
        header: "Patient",
        cell: (order: LabOrder) => (
          <div>
            <p className="text-sm font-medium text-foreground">{order.patientName}</p>
            <p className="text-xs text-muted-foreground font-mono">{order.uhid}</p>
            <p className="text-xs text-muted-foreground font-mono">{order.orderId}</p>
          </div>
        ),
      },
      {
        id: "test",
        header: "Test",
        cell: (order: LabOrder) => (
          <div>
            <p className="text-sm max-w-[220px] truncate">{order.tests}</p>
            <Badge variant="outline" className="text-xs mt-1">{order.category}</Badge>
          </div>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        cell: (order: LabOrder) => (
          <WorklistStatusChip label={order.priority} tone={priorityTone(order.priority)} />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: (order: LabOrder) => (
          <div className="flex justify-end gap-2">
            {order.stage === "Pending Analysis" && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => startAnalysis(order)}>
                Start analysis
              </Button>
            )}
            <Button size="sm" className="text-xs h-7" onClick={() => openOrder(order)}>
              Open
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Worklist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeOrders.length} active orders · Sample → Verify → Report workflow on each row
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active"><ListChecks className="h-3.5 w-3.5 mr-1" /> Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="pending-samples"><Clock className="h-3.5 w-3.5 mr-1" /> Pending Samples ({delayedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search order, patient, UHID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hematology">Hematology</SelectItem>
                <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                <SelectItem value="Microbiology">Microbiology</SelectItem>
                <SelectItem value="Serology">Serology</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DepartmentWorklistTable
            rows={filteredOrders}
            columns={worklistColumns}
            getRowKey={(order) => order.orderId}
            emptyMessage="No lab orders. Orders appear when doctors request tests during consultation."
          />
        </TabsContent>

        <TabsContent value="pending-samples" className="mt-4 space-y-4">
          {delayedOrders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No pending sample collections</div>
          ) : delayedOrders.map((order) => (
            <div key={order.orderId} className="rounded-lg border border-border border-l-4 border-l-warning p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-mono text-foreground">{order.orderId}</span>
                  <WorklistStatusChip label="Sample pending" tone="secondary" className="ml-2" />
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markSampleReceived(order)}>Mark received</Button>
              </div>
              <p className="text-sm font-medium">{order.patientName} · {order.uhid}</p>
              <p className="text-xs text-muted-foreground">{order.tests}</p>
              <LabWorkflowStepStrip order={order} className="mt-2" />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Lab Order {selectedOrder.orderId}
                  <WorklistStatusChip label={selectedOrder.stage} tone={stageTone(selectedOrder.stage)} />
                </DialogTitle>
              </DialogHeader>

              {(selectedOrder.criticalAlert || selectedOrder.platformLabState === "critical_review") && (
                <CriticalResultBanner
                  patientName={selectedOrder.patientName}
                  orderId={selectedOrder.orderId}
                  platformCritical={selectedOrder.platformLabState === "critical_review"}
                />
              )}

              <LabWorkflowStepStrip order={selectedOrder} />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedOrder.patientName}</span></div>
                <div><span className="text-muted-foreground">UHID:</span> {selectedOrder.uhid}</div>
                <div><span className="text-muted-foreground">Doctor:</span> {selectedOrder.doctor}</div>
                <div><span className="text-muted-foreground">Priority:</span> {selectedOrder.priority}</div>
                <div>
                  <span className="text-muted-foreground">Billing paid:</span>{" "}
                  ₹{(billingByUhid.get(selectedOrder.uhid)?.paid || 0).toLocaleString("en-IN")}
                </div>
                <div>
                  <span className="text-muted-foreground">Billing due:</span>{" "}
                  ₹{(billingByUhid.get(selectedOrder.uhid)?.due || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-span-2"><span className="text-muted-foreground">Tests:</span> {selectedOrder.tests}</div>
              </div>

              {(selectedOrder.stage === "In Analysis" || selectedOrder.stage === "Awaiting Validation") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Results entry</p>
                  <Textarea
                    rows={8}
                    value={resultsDraft}
                    onChange={(event) => setResultsDraft(event.target.value)}
                    placeholder="Enter key observations, values, and interpretation..."
                  />
                  <Button className="w-full" onClick={saveResults}>Save results for validation</Button>
                </div>
              )}

              {(selectedOrder.stage === "Validated" || selectedOrder.stage === "Reported") && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Report summary</p>
                  <div className="rounded-lg border p-4 text-sm whitespace-pre-wrap">
                    {selectedOrder.results || "Results not entered yet."}
                  </div>
                </div>
              )}

              {(selectedOrder.stage === "Awaiting Validation" || selectedOrder.stage === "Validated") && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Validator</p>
                    <Input value={validatorName} onChange={(event) => setValidatorName(event.target.value)} />
                  </div>
                  <LabGovernedActions
                    platformLabState={selectedOrder.platformLabState}
                    localStage={selectedOrder.stage}
                    hasResults={!!(selectedOrder.results?.trim() || resultsDraft.trim())}
                    onVerify={validateOrder}
                    onRelease={releaseReport}
                    showVerify={selectedOrder.stage === "Awaiting Validation"}
                    showRelease
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
