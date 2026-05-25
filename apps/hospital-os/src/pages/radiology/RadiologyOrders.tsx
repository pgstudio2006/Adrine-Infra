import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useHospital, type RadiologyOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";

const statusColor: Record<RadiologyOrder["status"], string> = {
  Ordered: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Completed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Reported: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function RadiologyOrders() {
  const { radiologyOrders, updateRadiologyOrder } = useHospital();
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("2026-03-08");
  const [scheduleTime, setScheduleTime] = useState("11:30");
  const [technician, setTechnician] = useState("Tech. Ramesh");
  const [procedureNotes, setProcedureNotes] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<RadiologyOrder["priority"] | "">("");

  useDepartmentWorklistSync("radiology");

  const selectedOrder = radiologyOrders.find((order) => order.orderId === selectedOrderId) || null;
  const modalities = ["All", ...Array.from(new Set(radiologyOrders.map(order => order.modality)))];

  const filteredOrders = useMemo(() => {
    return radiologyOrders.filter((order) => {
      const query = search.toLowerCase();
      const matchesSearch =
        order.patientName.toLowerCase().includes(query) ||
        order.orderId.toLowerCase().includes(query) ||
        order.uhid.toLowerCase().includes(query);
      const matchesModality = modalityFilter === "All" || order.modality === modalityFilter;
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesModality && matchesStatus;
    });
  }, [modalityFilter, radiologyOrders, search, statusFilter]);

  const openOrder = (order: RadiologyOrder) => {
    setSelectedOrderId(order.orderId);
    setScheduleDate(order.scheduledDate || "2026-03-08");
    setScheduleTime(order.scheduledTime || "11:30");
    setTechnician(order.technician || "Tech. Ramesh");
    setProcedureNotes(order.reportFindings || "");
  };

  const scheduleProcedure = () => {
    if (!selectedOrder) return;
    updateRadiologyOrder(selectedOrder.orderId, {
      status: "Scheduled",
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      technician,
    });
  };

  const markInProgress = () => {
    if (!selectedOrder) return;
    updateRadiologyOrder(selectedOrder.orderId, {
      status: "In Progress",
      technician,
    });
  };

  const completeImaging = () => {
    if (!selectedOrder) return;
    updateRadiologyOrder(selectedOrder.orderId, {
      status: "Completed",
      technician,
      reportFindings: procedureNotes || selectedOrder.reportFindings,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Imaging Orders</h1>
        <p className="text-muted-foreground text-sm">Live radiology scheduling and procedure tracking from doctor orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient, UHID, or order ID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
        <AppSelect
          value={modalityFilter}
          onValueChange={setModalityFilter}
          options={modalities.map((modality) => ({ value: modality, label: modality }))}
          className="w-40 rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <AppSelect
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "Ordered", label: "Ordered" },
            { value: "Scheduled", label: "Scheduled" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
            { value: "Reported", label: "Reported" },
          ]}
          className="w-40 rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Study</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No imaging orders. They appear here when doctors request radiology.</TableCell></TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                  <TableCell>
                    <div><span className="font-medium">{order.patientName}</span><br /><span className="text-xs text-muted-foreground">{order.uhid}</span></div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[220px] truncate">{order.study}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{order.modality}</Badge></TableCell>
                  <TableCell className="text-sm">{order.doctor}</TableCell>
                  <TableCell>
                    <Badge variant={order.priority === "Emergency" || order.priority === "STAT" ? "destructive" : order.priority === "Urgent" ? "default" : "secondary"} className="text-xs">{order.priority}</Badge>
                  </TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[order.status]}`}>{order.status}</span></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openOrder(order)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Order {selectedOrder.orderId}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selectedOrder.status]}`}>{selectedOrder.status}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedOrder.patientName}</span></div>
                <div><span className="text-muted-foreground">UHID:</span> {selectedOrder.uhid}</div>
                <div><span className="text-muted-foreground">Doctor:</span> {selectedOrder.doctor}</div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>{' '}
                  <div className="inline-flex items-center gap-2 ml-1">
                    <span className={`font-medium ${selectedOrder.priority === 'STAT' ? 'text-destructive' : ''}`}>{selectedOrder.priority}</span>
                    <select
                      className="h-7 rounded border border-input bg-background px-1 text-[10px]"
                      value={selectedPriority || selectedOrder.priority}
                      onChange={e => {
                        const val = e.target.value as RadiologyOrder["priority"];
                        setSelectedPriority(val);
                        if (selectedOrder) {
                          updateRadiologyOrder(selectedOrder.orderId, { priority: val });
                        }
                      }}
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                      <option value="STAT" className="font-bold text-destructive">STAT</option>
                    </select>
                    {selectedOrder.priority === 'STAT' && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                </div>
                <div className="col-span-2"><span className="text-muted-foreground">Study:</span> {selectedOrder.study}</div>
              </div>

              <div className="space-y-4 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Schedule Date</p>
                    <Input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Schedule Time</p>
                    <Input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium mb-1">Technician</p>
                    <Input value={technician} onChange={(event) => setTechnician(event.target.value)} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Procedure Notes</p>
                  <Textarea rows={4} value={procedureNotes} onChange={(event) => setProcedureNotes(event.target.value)} placeholder="Procedure observations, positioning, contrast notes..." />
                </div>

                <div className="flex gap-2">
                  {(selectedOrder.status === "Ordered" || selectedOrder.status === "Scheduled") && (
                    <Button className="flex-1" variant="outline" onClick={scheduleProcedure}>
                      <Calendar className="h-4 w-4 mr-2" /> Save Schedule
                    </Button>
                  )}
                  {(selectedOrder.status === "Ordered" || selectedOrder.status === "Scheduled") && (
                    <Button className="flex-1" onClick={markInProgress}>
                      <Clock className="h-4 w-4 mr-2" /> Start Procedure
                    </Button>
                  )}
                  {(selectedOrder.status === "In Progress" || selectedOrder.status === "Scheduled") && (
                    <Button className="flex-1" onClick={completeImaging}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Complete Imaging
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
