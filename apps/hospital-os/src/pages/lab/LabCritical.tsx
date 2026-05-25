import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, PhoneCall, ShieldCheck } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

type CallbackRecord = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  test: string;
  value: string;
  calledTo: string;
  calledBy: string;
  readBack: boolean;
  doctorAck: boolean;
  note: string;
  at: string;
};

let seq = 0;
const newId = () => `cb-${Date.now()}-${seq++}`;

export default function LabCritical() {
  const { labOrders } = useHospital();
  const { user } = useAuth();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();
  const techName = user?.name ?? "Lab tech";

  const criticalOrders = useMemo(
    () => labOrders.filter((o) => o.criticalAlert && o.stage !== "Reported"),
    [labOrders],
  );

  const [log, setLog] = useState<CallbackRecord[]>([]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [calledTo, setCalledTo] = useState("");
  const [readBack, setReadBack] = useState(false);
  const [doctorAck, setDoctorAck] = useState(false);
  const [note, setNote] = useState("");

  const logByOrder = useMemo(() => {
    const map = new Map<string, CallbackRecord>();
    for (const rec of log) {
      if (!map.has(rec.orderId)) map.set(rec.orderId, rec);
    }
    return map;
  }, [log]);

  const resetForm = () => {
    setCalledTo("");
    setReadBack(false);
    setDoctorAck(false);
    setNote("");
  };

  const submitCallback = (order: (typeof criticalOrders)[number]) => {
    if (!calledTo.trim()) {
      toast.error("Enter who the result was communicated to.");
      return;
    }
    const record: CallbackRecord = {
      id: newId(),
      orderId: order.orderId,
      patientName: order.patientName,
      uhid: order.uhid,
      test: order.tests.split(",")[0]?.trim() || order.tests,
      value: order.results?.slice(0, 64) || "Critical flag",
      calledTo: calledTo.trim(),
      calledBy: techName,
      readBack,
      doctorAck,
      note: note.trim(),
      at: new Date().toLocaleString(),
    };
    setLog((prev) => [record, ...prev]);
    setOpenFor(null);
    resetForm();
    toast.success("Critical callback logged", {
      description: `${record.test} communicated to ${record.calledTo}${readBack ? " · read-back confirmed" : ""}.`,
    });
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Critical values"
          detail={`${criticalOrders.length} active critical order(s) from branch worklist`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Critical value callback log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Communicate panic results, record read-back, and capture clinician acknowledgement.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/lab/worklist">Back to worklist</Link>
        </Button>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Callback log scope</AlertTitle>
        <AlertDescription className="text-xs">
          This callback log is recorded locally for the shift. A first-class critical-callback entity with a
          clinician acknowledgement inbox is a planned domain feature (lab W1 / doctor <code>/doctor/critical</code>).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Active critical results
            <Badge variant="outline" className="ml-1 text-xs">{criticalOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {criticalOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No active critical flags. Critical orders from the branch worklist appear here for callback.
            </p>
          ) : (
            criticalOrders.map((o) => {
              const done = logByOrder.get(o.orderId);
              return (
                <div key={o.orderId} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {o.patientName} <span className="font-normal text-muted-foreground">· {o.uhid}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.tests} · ordered by {o.doctor}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {done ? (
                      <Badge variant="outline" className="text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Called {done.calledTo}
                      </Badge>
                    ) : null}
                    <Dialog
                      open={openFor === o.orderId}
                      onOpenChange={(v) => {
                        setOpenFor(v ? o.orderId : null);
                        if (!v) resetForm();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant={done ? "outline" : "default"} className="h-7 text-xs">
                          <PhoneCall className="mr-1 h-3.5 w-3.5" />
                          {done ? "Log again" : "Log callback"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Critical callback — {o.patientName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                            {o.tests} · {o.results?.slice(0, 80) || "Critical flag"}
                          </div>
                          <div>
                            <Label>Communicated to</Label>
                            <Input
                              value={calledTo}
                              onChange={(e) => setCalledTo(e.target.value)}
                              placeholder="e.g. Dr. Mehta (ordering) / Ward 2 nurse"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="readback"
                              checked={readBack}
                              onCheckedChange={(v) => setReadBack(v === true)}
                            />
                            <Label htmlFor="readback" className="text-sm font-normal">
                              Read-back confirmed (recipient repeated result)
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="ack"
                              checked={doctorAck}
                              onCheckedChange={(v) => setDoctorAck(v === true)}
                            />
                            <Label htmlFor="ack" className="text-sm font-normal">
                              Clinician acknowledged
                            </Label>
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Time of call, instructions given, repeat sample requested…"
                            />
                          </div>
                          <Button className="w-full" onClick={() => submitCallback(o)}>
                            Save callback record
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Callback history ({log.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {log.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No callbacks logged this shift.
            </p>
          ) : (
            log.map((rec) => (
              <div key={rec.id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {rec.patientName} <span className="font-normal text-muted-foreground">· {rec.uhid}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{rec.at}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {rec.test}: <span className="font-mono">{rec.value}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">To: {rec.calledTo}</Badge>
                  <Badge variant="outline" className="text-xs">By: {rec.calledBy}</Badge>
                  {rec.readBack && <Badge variant="secondary" className="text-xs">Read-back ✓</Badge>}
                  {rec.doctorAck && <Badge variant="secondary" className="text-xs">Ack ✓</Badge>}
                </div>
                {rec.note ? <p className="mt-1 text-xs text-muted-foreground">{rec.note}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
