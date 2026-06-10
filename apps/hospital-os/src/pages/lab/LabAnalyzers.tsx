import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cpu, Inbox, Link2, Play, FileText, Unplug, Radio } from "lucide-react";
import { PATHOLOGY_MACHINES } from "@/lib/lis/pathology-machines";
import {
  connectAllMachines,
  connectMachine,
  disconnectAllMachines,
  disconnectMachine,
  getMachineById,
  getMiddlewareSnapshot,
  markMessageMatched,
  markMessageReleased,
  resultsTextFromMessage,
  simulateInboundResult,
  type MachineConnectionState,
} from "@/lib/lis/lis-middleware-store";
import type { InboundMachineMessage } from "@/lib/lis/pathology-machines";
import { openLabReportPrintWindow } from "@/lib/lis/lab-report-document";
import { useHospital } from "@/stores/hospitalStore";
import { toast } from "sonner";

const statusVariant: Record<string, "outline" | "secondary" | "destructive" | "default"> = {
  connected: "default",
  connecting: "secondary",
  disconnected: "outline",
  error: "destructive",
};

export default function LabAnalyzers() {
  const navigate = useNavigate();
  const { labOrders, updateLabOrder, updateLabStage } = useHospital();
  const [connections, setConnections] = useState<MachineConnectionState[]>([]);
  const [inbox, setInbox] = useState<InboundMachineMessage[]>([]);
  const [busyMachineId, setBusyMachineId] = useState<string | null>(null);
  const [connectingAll, setConnectingAll] = useState(false);
  const [demoMachineId, setDemoMachineId] = useState(PATHOLOGY_MACHINES[0].id);
  const [demoOrderId, setDemoOrderId] = useState("");
  const [hl7Preview, setHl7Preview] = useState<InboundMachineMessage | null>(null);

  const refresh = useCallback(() => {
    const snapshot = getMiddlewareSnapshot();
    setConnections(snapshot.connections);
    setInbox(snapshot.inbox);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeOrders = useMemo(
    () => labOrders.filter((o) => o.stage !== "Reported"),
    [labOrders],
  );

  useEffect(() => {
    if (!demoOrderId && activeOrders[0]) {
      setDemoOrderId(activeOrders[0].orderId);
    }
  }, [activeOrders, demoOrderId]);

  const connectedCount = connections.filter((c) => c.status === "connected").length;
  const pendingCount = inbox.filter((m) => m.status === "pending").length;

  const handleConnect = async (machineId: string) => {
    setBusyMachineId(machineId);
    try {
      await connectMachine(machineId);
      toast.success(`${getMachineById(machineId)?.make} connected via middleware`);
      refresh();
    } catch {
      toast.error("Connection failed");
    } finally {
      setBusyMachineId(null);
    }
  };

  const handleConnectAll = async () => {
    setConnectingAll(true);
    try {
      await connectAllMachines();
      toast.success("All 8 pathology analysers connected to Adrine LIS middleware");
      refresh();
    } finally {
      setConnectingAll(false);
    }
  };

  const runMachineDemo = async () => {
    const order = labOrders.find((o) => o.orderId === demoOrderId);
    const machine = getMachineById(demoMachineId);
    if (!order || !machine) {
      toast.error("Select a lab order and machine");
      return;
    }

    const connection = connections.find((c) => c.machineId === demoMachineId);
    if (connection?.status !== "connected") {
      toast.error("Connect the instrument first");
      return;
    }

    const barcode = order.sampleId || `SMP-${order.orderId}`;
    try {
      const message = simulateInboundResult({
        machineId: demoMachineId,
        sampleBarcode: barcode,
        patientName: order.patientName,
        uhid: order.uhid,
      });

      const results = resultsTextFromMessage(message);
      const interpretation = message.parsedLines.some((l) => l.flag === "C" || l.flag === "H" || l.flag === "L")
        ? "Abnormal values flagged by instrument delta-check rules. Pathologist review recommended."
        : "Results within reference range.";

      updateLabOrder(order.orderId, {
        sampleId: barcode,
        specimenType: order.specimenType || "Blood",
        methodName: `${machine.make} ${machine.model} (${machine.protocol})`,
        results,
        interpretation,
        comments: `Auto-ingested via Adrine LIS middleware — zero manual entry. Message ${message.id}`,
        sampleStatus: "Analysis Complete",
      });
      updateLabStage(order.orderId, "Awaiting Validation");
      markMessageMatched(message.id);
      refresh();
      setHl7Preview(message);
      toast.success(`Results received from ${machine.make} — report ready for validation`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    }
  };

  const releaseDemoReport = (message: InboundMachineMessage) => {
    const order = labOrders.find(
      (o) => o.uhid === message.uhid || o.sampleId === message.sampleBarcode,
    );
    const machine = getMachineById(message.machineId);
    if (!order) {
      toast.error("Matching lab order not found");
      return;
    }

    openLabReportPrintWindow({
      labName: "ADRINE Laboratory Information System",
      orderId: order.orderId,
      patientName: order.patientName,
      uhid: order.uhid,
      specimenType: order.specimenType || "Blood",
      methodName: order.methodName || `${machine?.make} ${machine?.model}`,
      reportedAt: new Date().toLocaleString("en-IN"),
      results: order.results || resultsTextFromMessage(message),
      interpretation: order.interpretation || "",
      comments: order.comments || "",
      authorizedBy: order.authorizedBy || "Dr. Pathak, MD Pathology",
      machineSource: machine ? `${machine.make} ${machine.model}` : undefined,
    });
    markMessageReleased(message.id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">LIS Machine Integration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            HL7 / ASTM / Serial middleware — all 8 pathology analysers from your equipment inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">{connectedCount}/8 connected</Badge>
          <Badge variant="outline" className="text-xs">{pendingCount} pending ORU</Badge>
          <Button size="sm" onClick={handleConnectAll} disabled={connectingAll}>
            <Link2 className="h-4 w-4 mr-1" />
            {connectingAll ? "Connecting…" : "Connect all 8"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { disconnectAllMachines(); refresh(); }}>
            <Unplug className="h-4 w-4 mr-1" /> Disconnect all
          </Button>
        </div>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <Radio className="h-4 w-4" />
        <AlertTitle className="text-sm">Live integration demo</AlertTitle>
        <AlertDescription className="text-xs">
          Connect instruments, run &quot;Simulate result transmission&quot;, and watch ORU messages auto-fill lab orders
          with branded PDF report generation — no manual transcription.
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" /> End-to-end demo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Lab order</p>
            <Select value={demoOrderId} onValueChange={setDemoOrderId}>
              <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                {activeOrders.map((o) => (
                  <SelectItem key={o.orderId} value={o.orderId}>
                    {o.orderId} — {o.patientName} ({o.tests})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Analyser</p>
            <Select value={demoMachineId} onValueChange={setDemoMachineId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATHOLOGY_MACHINES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.make} — {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runMachineDemo}>
            <Cpu className="h-4 w-4 mr-1" /> Simulate result transmission
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" /> Pathology analysers (equipment inventory)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {PATHOLOGY_MACHINES.map((machine) => {
                const conn = connections.find((c) => c.machineId === machine.id);
                const status = conn?.status ?? "disconnected";
                return (
                  <TableRow key={machine.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{machine.name}</p>
                      <p className="text-xs text-muted-foreground">{machine.make} · {machine.model}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{machine.section}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{machine.protocol}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {machine.host}:{machine.port}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[status]} className="text-xs capitalize">{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{conn?.messagesReceived ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {status === "connected" ? (
                        <Button size="sm" variant="ghost" onClick={() => { disconnectMachine(machine.id); refresh(); }}>
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyMachineId === machine.id}
                          onClick={() => handleConnect(machine.id)}
                        >
                          Connect
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" /> Inbound HL7 message inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inbox.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Connect an analyser and simulate result transmission.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbox.map((msg) => {
                  const machine = getMachineById(msg.machineId);
                  return (
                    <TableRow key={msg.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(msg.receivedAt).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-sm">{machine?.make} {machine?.model}</TableCell>
                      <TableCell className="font-mono text-xs">{msg.sampleBarcode}</TableCell>
                      <TableCell>
                        <p className="text-sm">{msg.patientName}</p>
                        <p className="text-xs text-muted-foreground">{msg.uhid}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{msg.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setHl7Preview(msg)}>HL7</Button>
                        <Button size="sm" variant="outline" onClick={() => releaseDemoReport(msg)}>
                          <FileText className="h-3 w-3 mr-1" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/lab/reports")}>
          Open report validation →
        </Button>
      </div>

      <Dialog open={!!hl7Preview} onOpenChange={() => setHl7Preview(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raw HL7 ORU^R01 — {hl7Preview?.id}</DialogTitle>
          </DialogHeader>
          {hl7Preview && (
            <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {hl7Preview.rawHl7}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
