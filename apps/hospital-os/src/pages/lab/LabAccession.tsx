import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Barcode, PackageCheck, XCircle } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { sectionForCategory } from "./labReferenceData";

const REJECT_REASONS = [
  "Hemolysed sample",
  "Insufficient volume (QNS)",
  "Wrong container / tube",
  "Unlabelled / mislabelled",
  "Clotted specimen",
  "Leaked in transit",
];

function makeBarcode(sampleId?: string | null): string {
  const base = sampleId?.replace(/[^A-Za-z0-9]/g, "") ?? `${Date.now()}`;
  return `ACC${base.slice(-8).toUpperCase()}`;
}

export default function LabAccession() {
  const { labOrders, updateLabOrder } = useHospital();
  const { user } = useAuth();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();
  const tech = user?.name ?? "Lab tech";

  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState("");

  const queue = useMemo(
    () => labOrders.filter((o) => o.sampleStatus === "Collected"),
    [labOrders],
  );

  const receive = (orderId: string, sampleId?: string | null) => {
    const barcode = makeBarcode(sampleId);
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    updateLabOrder(orderId, {
      sampleStatus: "Received",
      stage: "Pending Analysis",
      comments: `Accessioned ${barcode} by ${tech} at ${time}`,
    });
    toast.success("Sample accessioned", { description: `Accession ${barcode} received into the lab.` });
  };

  const confirmReject = (orderId: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    updateLabOrder(orderId, {
      sampleStatus: "Ordered",
      sampleId: undefined,
      comments: `REJECTED (${rejectReason})${rejectNote ? ` — ${rejectNote}` : ""} · recollect requested by ${tech} at ${time}`,
    });
    setRejectFor(null);
    setRejectNote("");
    toast.warning("Sample rejected — recollect requested", {
      description: `${rejectReason}. Order returned to phlebotomy collection queue.`,
    });
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Accession desk"
          detail={`${queue.length} collected sample(s) awaiting accession`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Accession desk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Receive collected samples, assign accession identity, or reject with a recollect reason.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Chain of custody</AlertTitle>
        <AlertDescription className="text-xs">
          Accession assigns a barcode and advances the sample to the bench. Rejection returns the order to the
          phlebotomy queue with a coded reason. A governed reject/recollect transition is planned (lab W1/W3).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Barcode className="h-4 w-4" /> Collected — awaiting accession ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Section</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No collected samples awaiting accession.
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((o) => (
                  <TableRow key={o.orderId}>
                    <TableCell>
                      <p className="font-mono text-sm text-foreground">{o.sampleId ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.orderId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                      <p className="text-xs text-muted-foreground">{o.uhid}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{o.tests}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sectionForCategory(o.category)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={() => receive(o.orderId, o.sampleId)}>
                          <PackageCheck className="mr-1 h-3.5 w-3.5" />
                          Receive
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive"
                          onClick={() => {
                            setRejectFor(o.orderId);
                            setRejectReason(REJECT_REASONS[0]);
                          }}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(rejectFor)} onOpenChange={(v) => !v && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject sample & request recollect</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Rejection reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Additional detail for the collecting team…"
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => rejectFor && confirmReject(rejectFor)}
            >
              Reject & request recollect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
