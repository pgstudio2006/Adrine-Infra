import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, CheckCircle, Clock, ScanLine, AlertTriangle } from "lucide-react";
import { useHospital, type RadiologyOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { WorklistStatusChip, type WorklistChipTone } from "@/components/diagnostics/WorklistStatusChip";

const statusTone: Record<RadiologyOrder["status"], WorklistChipTone> = {
  Ordered: "outline",
  Scheduled: "secondary",
  "In Progress": "default",
  Completed: "secondary",
  Reported: "default",
};

export default function RadiologyWorklist() {
  const { radiologyOrders, updateRadiologyOrder } = useHospital();
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [tab, setTab] = useState("active");

  useDepartmentWorklistSync("radiology");

  const modalities = ["All", ...Array.from(new Set(radiologyOrders.map((o) => o.modality)))];

  const filtered = radiologyOrders.filter((w) => {
    const matchSearch =
      w.patientName.toLowerCase().includes(search.toLowerCase()) ||
      w.orderId.toLowerCase().includes(search.toLowerCase());
    const matchModality = modalityFilter === "All" || w.modality === modalityFilter;
    const matchTab = tab === "active" ? w.status !== "Reported" : w.status === "Reported";
    return matchSearch && matchModality && matchTab;
  });

  const waiting = radiologyOrders.filter((w) => w.status === "Ordered" || w.status === "Scheduled").length;
  const inProgress = radiologyOrders.filter((w) => w.status === "In Progress").length;

  const advanceStatus = (order: RadiologyOrder, next: RadiologyOrder["status"]) => {
    updateRadiologyOrder(order.orderId, { status: next });
  };

  const columns = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: (order: RadiologyOrder) => (
          <WorklistStatusChip label={order.status} tone={statusTone[order.status]} />
        ),
      },
      {
        id: "patient",
        header: "Patient",
        cell: (order: RadiologyOrder) => (
          <div>
            <p className="text-sm font-medium">{order.patientName}</p>
            <p className="text-xs text-muted-foreground font-mono">{order.uhid}</p>
            <p className="text-xs text-muted-foreground font-mono">{order.orderId}</p>
          </div>
        ),
      },
      {
        id: "study",
        header: "Study",
        cell: (order: RadiologyOrder) => (
          <div>
            <p className="text-sm">{order.study}</p>
            <p className="text-xs text-muted-foreground">{order.modality}</p>
          </div>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        cell: (order: RadiologyOrder) => (
          <span className="text-sm inline-flex items-center gap-1">
            {order.priority === "Emergency" && <AlertTriangle className="h-4 w-4 text-destructive" />}
            {order.priority}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: (order: RadiologyOrder) => (
          <div className="flex justify-end flex-wrap gap-1">
            {order.status === "Ordered" && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => advanceStatus(order, "Scheduled")}>
                Schedule
              </Button>
            )}
            {(order.status === "Ordered" || order.status === "Scheduled") && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => advanceStatus(order, "In Progress")}>
                <Play className="h-3 w-3" /> Start
              </Button>
            )}
            {order.status === "In Progress" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => advanceStatus(order, "Completed")}>
                Complete imaging
              </Button>
            )}
            {order.status === "Completed" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => advanceStatus(order, "Reported")}>
                Release report
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Radiology Worklist</h1>
        <p className="text-muted-foreground text-sm">
          Unified worklist — status transitions use governed platform actions when runtime is enabled
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{waiting}</p>
              <p className="text-xs text-muted-foreground">Waiting / Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {radiologyOrders.filter((w) => w.status === "Reported").length}
              </p>
              <p className="text-xs text-muted-foreground">Reported</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={modalityFilter} onValueChange={setModalityFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modalities.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="done">Completed / Reported</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <DepartmentWorklistTable
            rows={filtered}
            columns={columns}
            getRowKey={(order) => order.orderId}
            emptyMessage="No radiology orders in this view."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
