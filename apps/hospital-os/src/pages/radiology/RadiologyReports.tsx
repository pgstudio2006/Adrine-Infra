import { useMemo, useState } from "react";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, FileText, CheckCircle, Send } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";

const statusColor: Record<string, string> = {
  Completed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Reported: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function RadiologyReports() {
  const { radiologyOrders, updateRadiologyOrder } = useHospital();
  useDepartmentWorklistSync("radiology");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [radiologist, setRadiologist] = useState("Dr. Iyer");
  const [isCritical, setIsCritical] = useState(false);
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [technique, setTechnique] = useState("");
  const [comparisonStudy, setComparisonStudy] = useState("");
  const [contrastUsed, setContrastUsed] = useState("Not used");

  const reportOrders = useMemo(
    () => radiologyOrders.filter(order => order.status === "Completed" || order.status === "Reported"),
    [radiologyOrders],
  );

  const filteredOrders = reportOrders.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch =
      order.patientName.toLowerCase().includes(query) ||
      order.orderId.toLowerCase().includes(query) ||
      order.uhid.toLowerCase().includes(query);
    const matchesTab = tab === "all" || order.status === tab;
    return matchesSearch && matchesTab;
  });

  const selectedOrder = radiologyOrders.find(order => order.orderId === selectedOrderId) || null;

  const openReport = (orderId: string) => {
    const order = radiologyOrders.find(item => item.orderId === orderId);
    if (!order) return;

    setSelectedOrderId(orderId);
    setFindings(order.reportFindings || "");
    setImpression(order.reportImpression || "");
    setRecommendation(order.recommendation || "");
    setRadiologist(order.radiologist || "Dr. Iyer");
    setIsCritical(Boolean(order.critical));
    setClinicalHistory(order.clinicalHistory || "");
    setTechnique(order.technique || "");
    setComparisonStudy(order.comparisonStudy || "");
    setContrastUsed(order.contrastUsed || "Not used");
  };

  const saveReport = (markReported: boolean) => {
    if (!selectedOrder) return;

    updateRadiologyOrder(selectedOrder.orderId, {
      status: markReported ? "Reported" : "Completed",
      reportFindings: findings.trim(),
      reportImpression: impression.trim(),
      recommendation: recommendation.trim(),
      radiologist: radiologist.trim() || "Dr. Iyer",
      critical: isCritical,
      clinicalHistory: clinicalHistory.trim(),
      technique: technique.trim(),
      comparisonStudy: comparisonStudy.trim(),
      contrastUsed,
      reportedAt: markReported ? new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : selectedOrder.reportedAt,
    });

    if (markReported) {
      setSelectedOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Radiology Reports</h1>
        <p className="text-muted-foreground text-sm">Create, review, and release imaging reports from completed procedures</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient, report order, or UHID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Completed</p><p className="text-2xl font-bold">{radiologyOrders.filter(order => order.status === "Completed").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Reported</p><p className="text-2xl font-bold">{radiologyOrders.filter(order => order.status === "Reported").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Critical Findings</p><p className="text-2xl font-bold">{radiologyOrders.filter(order => order.critical).length}</p></CardContent></Card>
      </div>

      <div className="flex gap-2">
        {["all", "Completed", "Reported"].map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "all" ? `All (${reportOrders.length})` : `${value} (${reportOrders.filter(order => order.status === value).length})`}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Study</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Radiologist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No report-ready radiology studies yet.</TableCell></TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {order.orderId}
                      {order.critical && <Badge variant="destructive" className="text-xs">CRITICAL</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div><span className="font-medium">{order.patientName}</span><br /><span className="text-xs text-muted-foreground">{order.uhid}</span></div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[220px] truncate">{order.study}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{order.modality}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.radiologist || "Pending"}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[order.status]}`}>{order.status}</span></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openReport(order.orderId)}><Eye className="h-4 w-4" /></Button>
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
                  <FileText className="h-5 w-5" /> Report for {selectedOrder.orderId}
                  {selectedOrder.critical && <Badge variant="destructive" className="text-xs">CRITICAL</Badge>}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedOrder.patientName}</span></div>
                <div><span className="text-muted-foreground">UHID:</span> {selectedOrder.uhid}</div>
                <div><span className="text-muted-foreground">Study:</span> {selectedOrder.study}</div>
                <div><span className="text-muted-foreground">Modality:</span> {selectedOrder.modality}</div>
                <div><span className="text-muted-foreground">Reported At:</span> {selectedOrder.reportedAt || "Not released"}</div>
                <div><span className="text-muted-foreground">Body Part:</span> {selectedOrder.bodyPart || "Not specified"}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Radiologist</p>
                  <Input value={radiologist} onChange={(event) => setRadiologist(event.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Clinical History</p>
                  <Textarea rows={2} value={clinicalHistory} onChange={(event) => setClinicalHistory(event.target.value)} placeholder="Symptoms, provisional diagnosis, reason for imaging..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Technique</p>
                    <Textarea rows={2} value={technique} onChange={(event) => setTechnique(event.target.value)} placeholder="AP/PA view, contrast phase, sequences acquired..." />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Comparison</p>
                    <Textarea rows={2} value={comparisonStudy} onChange={(event) => setComparisonStudy(event.target.value)} placeholder="Prior X-ray, CT, MRI, or no prior study..." />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Contrast Used</p>
                  <AppSelect
                    value={contrastUsed}
                    onValueChange={setContrastUsed}
                    options={[
                      { value: "Not used", label: "Not used" },
                      { value: "IV contrast used", label: "IV contrast used" },
                      { value: "Oral contrast used", label: "Oral contrast used" },
                      { value: "IV and oral contrast used", label: "IV and oral contrast used" },
                    ]}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Findings</p>
                  <Textarea rows={5} value={findings} onChange={(event) => setFindings(event.target.value)} placeholder="Describe the imaging findings..." />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Impression</p>
                  <Textarea rows={3} value={impression} onChange={(event) => setImpression(event.target.value)} placeholder="Final radiology impression..." />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Recommendation</p>
                  <Textarea rows={3} value={recommendation} onChange={(event) => setRecommendation(event.target.value)} placeholder="Follow-up recommendation for doctor/patient..." />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isCritical} onChange={(event) => setIsCritical(event.target.checked)} />
                  Mark as critical finding
                </label>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report Preview</p>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Clinical History:</span> {clinicalHistory || "Not added"}</p>
                  <p><span className="font-medium">Technique:</span> {technique || "Not added"}</p>
                  <p><span className="font-medium">Comparison:</span> {comparisonStudy || "None"}</p>
                  <p><span className="font-medium">Contrast:</span> {contrastUsed}</p>
                  <p><span className="font-medium">Findings:</span> {findings || "Pending"}</p>
                  <p><span className="font-medium">Impression:</span> {impression || "Pending"}</p>
                  <p><span className="font-medium">Recommendation:</span> {recommendation || "Pending"}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => saveReport(false)}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Save Draft
                </Button>
                <Button className="flex-1" onClick={() => saveReport(true)}>
                  <Send className="h-4 w-4 mr-2" /> Release Report
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
