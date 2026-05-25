import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileEdit, History } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const AMEND_REASONS = [
  "Transcription error",
  "Re-run confirmed different value",
  "Wrong units reported",
  "Patient/sample mix-up corrected",
  "Addendum — additional findings",
];

type AmendmentRecord = {
  id: string;
  orderId: string;
  patientName: string;
  test: string;
  previous: string;
  corrected: string;
  reason: string;
  by: string;
  at: string;
};

let seq = 0;

export default function LabAmendments() {
  const { labOrders, updateLabOrder } = useHospital();
  const { user } = useAuth();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();
  const tech = user?.name ?? "Pathologist";

  const amendable = useMemo(
    () => labOrders.filter((o) => o.stage === "Validated" || o.stage === "Reported"),
    [labOrders],
  );

  const [orderId, setOrderId] = useState("");
  const [corrected, setCorrected] = useState("");
  const [reason, setReason] = useState(AMEND_REASONS[0]);
  const [log, setLog] = useState<AmendmentRecord[]>([]);

  const selected = amendable.find((o) => o.orderId === orderId) ?? null;

  const submit = () => {
    if (!selected) {
      toast.error("Select a validated/reported order to amend.");
      return;
    }
    if (!corrected.trim()) {
      toast.error("Enter the corrected result.");
      return;
    }
    const previous = selected.results ?? "—";
    const time = new Date().toLocaleString();
    const record: AmendmentRecord = {
      id: `am-${Date.now()}-${seq++}`,
      orderId: selected.orderId,
      patientName: selected.patientName,
      test: selected.tests,
      previous,
      corrected: corrected.trim(),
      reason,
      by: tech,
      at: time,
    };
    updateLabOrder(selected.orderId, {
      results: corrected.trim(),
      comments: `AMENDED (${reason}) by ${tech} at ${time}. Previous: ${previous}`,
    });
    setLog((prev) => [record, ...prev]);
    setCorrected("");
    toast.success("Result amended", { description: "Corrected report recorded with reason and prior value." });
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Amendments"
          detail={`${amendable.length} validated/reported order(s) eligible for correction`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Corrected / amended results</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Issue reason-coded corrections to validated or released reports, preserving the prior value.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Amendment audit</AlertTitle>
        <AlertDescription className="text-xs">
          The corrected value and a reason are written to the order with the previous value preserved in comments.
          A versioned amendment chain with re-release notification is planned (lab W5).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileEdit className="h-4 w-4" /> Issue amendment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Order</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger className="md:max-w-lg">
                <SelectValue placeholder="Select validated/reported order" />
              </SelectTrigger>
              <SelectContent>
                {amendable.map((o) => (
                  <SelectItem key={o.orderId} value={o.orderId}>
                    {o.patientName} · {o.tests} ({o.stage})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected ? (
            <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
              Current result: <span className="font-mono">{selected.results || "—"}</span>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Corrected result</Label>
              <Textarea
                value={corrected}
                onChange={(e) => setCorrected(e.target.value)}
                placeholder="Corrected value / report text…"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMEND_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!selected} onClick={submit}>
              Save amendment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Amendment history ({log.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {log.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No amendments this session.</p>
          ) : (
            log.map((rec) => (
              <div key={rec.id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {rec.patientName} <span className="font-normal text-muted-foreground">· {rec.test}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{rec.at}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="line-through">{rec.previous}</span> →{" "}
                  <span className="font-mono text-foreground">{rec.corrected}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">{rec.reason}</Badge>
                  <Badge variant="outline" className="text-xs">By {rec.by}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
