import { useMemo, useState } from "react";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, FileText } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { canReleaseLabReport } from "@/operations/lab-stage-guards";

export default function LabReports() {
  const { labOrders, invoices, updateLabOrder, updateLabStage } = useHospital();
  const [search, setSearch] = useState("");

  useDepartmentWorklistSync("lab");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [specimenType, setSpecimenType] = useState("Blood");
  const [methodName, setMethodName] = useState("Automated analyzer");
  const [results, setResults] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [comments, setComments] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("Dr. Pathak");

  const reportableOrders = useMemo(
    () => labOrders.filter(order => order.stage === "Validated" || order.stage === "Reported"),
    [labOrders],
  );

  const filteredOrders = reportableOrders.filter((order) => {
    const query = search.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(query) ||
      order.orderId.toLowerCase().includes(query) ||
      order.uhid.toLowerCase().includes(query)
    );
  });

  const selectedOrder = labOrders.find(order => order.orderId === selectedOrderId) || null;

  const billingByUhid = useMemo(() => {
    const map = new Map<string, { paid: number; total: number; due: number }>();

    invoices.forEach((invoice) => {
      const current = map.get(invoice.uhid) || { paid: 0, total: 0, due: 0 };
      current.paid += invoice.paid;
      current.total += invoice.total;
      current.due += Math.max(0, invoice.total - invoice.paid);
      map.set(invoice.uhid, current);
    });

    return map;
  }, [invoices]);

  const openOrder = (orderId: string) => {
    const order = labOrders.find(item => item.orderId === orderId);
    if (!order) return;
    setSelectedOrderId(orderId);
    setSpecimenType(order.specimenType || "Blood");
    setMethodName(order.methodName || "Automated analyzer");
    setResults(order.results || "");
    setInterpretation(order.interpretation || "");
    setComments(order.comments || "");
    setAuthorizedBy(order.authorizedBy || order.validatedBy || "Dr. Pathak");
  };

  const saveReportDraft = (release: boolean) => {
    if (!selectedOrder) return;
    updateLabOrder(selectedOrder.orderId, {
      specimenType,
      methodName,
      results: results.trim(),
      interpretation: interpretation.trim(),
      comments: comments.trim(),
      authorizedBy: authorizedBy.trim() || "Dr. Pathak",
      validatedBy: authorizedBy.trim() || "Dr. Pathak",
      criticalAlert: /critical|panic|urgent/i.test(`${results} ${interpretation}`),
    });

    if (release) {
      if (!canReleaseLabReport(selectedOrder.platformLabState, selectedOrder.stage)) return;
      updateLabStage(selectedOrder.orderId, "Reported");
      setSelectedOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Released lab reports and validated result summaries</p>
        </div>
        <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Validated</p>
            <p className="text-2xl font-bold">{labOrders.filter(order => order.stage === "Validated").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Reported</p>
            <p className="text-2xl font-bold">{labOrders.filter(order => order.stage === "Reported").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Awaiting Validation</p>
            <p className="text-2xl font-bold">{labOrders.filter(order => order.stage === "Awaiting Validation").length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patient, order, or UHID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lab Report Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Validator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No report-ready lab orders yet.</TableCell></TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.orderId}>
                  {(() => {
                    const billing = billingByUhid.get(order.uhid);
                    return (
                      <>
                  <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                  <TableCell>
                    <p className="font-medium">{order.patientName}</p>
                    <p className="text-xs text-muted-foreground">{order.uhid}</p>
                  </TableCell>
                  <TableCell className="text-sm max-w-[280px] truncate">{order.tests}</TableCell>
                  <TableCell className="text-xs">
                    {billing ? (
                      <div>
                        <p className="font-medium text-foreground">Paid ₹{billing.paid.toLocaleString("en-IN")}</p>
                        <p className="text-muted-foreground">Due ₹{billing.due.toLocaleString("en-IN")}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No invoice</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.validatedBy || "Pending"}</TableCell>
                  <TableCell>
                    <Badge variant={order.stage === "Reported" ? "default" : "secondary"} className="text-xs">{order.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{order.reportedAt || "Not released"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openOrder(order.orderId)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                      </>
                    );
                  })()}
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
                <DialogTitle>Lab Report {selectedOrder.orderId}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedOrder.patientName}</span></div>
                <div><span className="text-muted-foreground">UHID:</span> {selectedOrder.uhid}</div>
                <div><span className="text-muted-foreground">Doctor:</span> {selectedOrder.doctor}</div>
                <div><span className="text-muted-foreground">Category:</span> {selectedOrder.category}</div>
                <div>
                  <span className="text-muted-foreground">Billing Paid:</span>{" "}
                  ₹{(billingByUhid.get(selectedOrder.uhid)?.paid || 0).toLocaleString("en-IN")}
                </div>
                <div>
                  <span className="text-muted-foreground">Billing Due:</span>{" "}
                  ₹{(billingByUhid.get(selectedOrder.uhid)?.due || 0).toLocaleString("en-IN")}
                </div>
                <div><span className="text-muted-foreground">Specimen:</span> {selectedOrder.specimenType || "Not recorded"}</div>
                <div><span className="text-muted-foreground">Method:</span> {selectedOrder.methodName || "Not recorded"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Tests:</span> {selectedOrder.tests}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium mb-1">Specimen Type</p>
                  <Input value={specimenType} onChange={(event) => setSpecimenType(event.target.value)} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Method / Instrument</p>
                  <Input value={methodName} onChange={(event) => setMethodName(event.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Results Summary</p>
                  <Textarea rows={6} value={results} onChange={(event) => setResults(event.target.value)} placeholder="CBC values, chemistry values, organism growth, final numeric summary..." />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Interpretation</p>
                  <Textarea rows={3} value={interpretation} onChange={(event) => setInterpretation(event.target.value)} placeholder="Clinical interpretation of the results..." />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Comments / Notes</p>
                  <Textarea rows={3} value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Pathologist comments, retest note, sample quality note..." />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Authorized By</p>
                  <Input value={authorizedBy} onChange={(event) => setAuthorizedBy(event.target.value)} />
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final Report Preview</p>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Specimen:</span> {specimenType}</p>
                  <p><span className="font-medium">Method:</span> {methodName}</p>
                  <p><span className="font-medium">Results:</span> {results || "Pending"}</p>
                  <p><span className="font-medium">Interpretation:</span> {interpretation || "Pending"}</p>
                  <p><span className="font-medium">Comments:</span> {comments || "None"}</p>
                  <p><span className="font-medium">Authorized By:</span> {authorizedBy || "Pending"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => saveReportDraft(false)}>Save Draft</Button>
                <Button className="flex-1" onClick={() => saveReportDraft(true)}>Release Report</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
