import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, CheckCheck, HelpCircle, Ban } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import {
  canUseNursingRuntime,
  platformCreateNursingNote,
} from "@/runtime/nursing-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { NursePageHeader, ClinicalTableEmptyRow } from "@/components/clinical/ClinicalTableStates";

type VerifyState = "acknowledged" | "clarify" | "refused";

type VerifyRecord = {
  state: VerifyState;
  reason: string;
  by: string;
  at: string;
};

const verifyBadge: Record<VerifyState, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  acknowledged: { label: "Acknowledged", variant: "secondary" },
  clarify: { label: "Clarification requested", variant: "outline" },
  refused: { label: "Refused", variant: "destructive" },
};

const priorityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  Emergency: "destructive",
  Urgent: "secondary",
  Routine: "outline",
};

export default function NurseOrders() {
  const { inpatientCareOrders, admissions } = useHospital();
  const { user } = useAuth();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformOn = canUseNursingRuntime();
  const nurseName = user?.name ?? "Nurse";

  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState<Record<string, VerifyRecord>>({});
  const [dialogFor, setDialogFor] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState<VerifyState>("acknowledged");
  const [reason, setReason] = useState("");

  const admissionById = useMemo(() => {
    const map = new Map<string, (typeof admissions)[number]>();
    for (const a of admissions) map.set(a.id, a);
    return map;
  }, [admissions]);

  const orders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inpatientCareOrders
      .filter((o) => o.status !== "Cancelled")
      .filter(
        (o) =>
          !q ||
          o.patientName.toLowerCase().includes(q) ||
          o.uhid.toLowerCase().includes(q) ||
          o.item.toLowerCase().includes(q) ||
          o.orderedBy.toLowerCase().includes(q),
      );
  }, [inpatientCareOrders, search]);

  const pendingCount = orders.filter((o) => o.status === "Pending" && !verified[o.id]).length;

  const openDialog = (orderId: string, state: VerifyState) => {
    setDialogFor(orderId);
    setPendingState(state);
    setReason("");
  };

  const confirm = async (order: (typeof orders)[number], state: VerifyState) => {
    if (state !== "acknowledged" && !reason.trim()) {
      toast.error("A reason is required to request clarification or refuse an order.");
      return;
    }
    const record: VerifyRecord = {
      state,
      reason: reason.trim(),
      by: nurseName,
      at: new Date().toLocaleString(),
    };
    setVerified((prev) => ({ ...prev, [order.id]: record }));
    setDialogFor(null);

    const admission = admissionById.get(order.admissionId);
    if (
      platformOn &&
      admission?.platformAdmissionId &&
      admission?.platformPatientId &&
      state !== "acknowledged"
    ) {
      try {
        await platformCreateNursingNote({
          admissionId: admission.platformAdmissionId,
          patientId: admission.platformPatientId,
          nurse: nurseName,
          noteType: "OrderVerification",
          body: `Order verification — ${verifyBadge[state].label}: ${order.type} "${order.item}" (ordered by ${order.orderedBy}). Reason: ${record.reason}`,
        });
        toast.success("Order verification logged to platform");
        return;
      } catch {
        toast.warning("Verification saved locally", {
          description: "Could not persist a nursing note for this verification.",
        });
        return;
      }
    }
    toast.success(`Order ${verifyBadge[state].label.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Doctor order verification"
          detail={`${pendingCount} order(s) awaiting nursing acknowledgement`}
        />
      )}

      <NursePageHeader
        title="Doctor order verification"
        description="Acknowledge, request clarification on, or refuse inpatient care orders before execution."
      />

      <Alert>
        <AlertTitle className="text-sm">Nursing acknowledgement scope</AlertTitle>
        <AlertDescription className="text-xs">
          Acknowledgement is tracked locally for the shift. Clarification/refusal on platform-linked admissions
          also persists an OrderVerification nursing note. A governed order-acknowledgement transition is a planned
          domain feature.
        </AlertDescription>
      </Alert>

      <div className="relative md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient, UHID, item, or doctor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inpatient care orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Ordered by</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <ClinicalTableEmptyRow
                  colSpan={6}
                  title="No care orders"
                  description="Procedure and diet orders raised on inpatients appear here for nursing verification."
                />
              ) : (
                orders.map((o) => {
                  const v = verified[o.id];
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                        <p className="text-xs text-muted-foreground">{o.uhid}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{o.item}</p>
                        <p className="text-xs text-muted-foreground">{o.type}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant[o.priority] ?? "outline"} className="text-xs">
                          {o.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.orderedBy}</TableCell>
                      <TableCell>
                        {v ? (
                          <Badge variant={verifyBadge[v.state].variant} className="text-xs">
                            {verifyBadge[v.state].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Awaiting</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={dialogFor === o.id}
                          onOpenChange={(open) => {
                            if (!open) setDialogFor(null);
                          }}
                        >
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => void confirm({ ...o }, "acknowledged")}
                              disabled={Boolean(v)}
                              title="Acknowledge"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => openDialog(o.id, "clarify")}
                                title="Request clarification"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive"
                                onClick={() => openDialog(o.id, "refused")}
                                title="Refuse"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                          </div>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {pendingState === "refused" ? "Refuse order" : "Request clarification"}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                                {o.type}: {o.item} · {o.patientName} · ordered by {o.orderedBy}
                              </div>
                              <div>
                                <Label>Action</Label>
                                <Select
                                  value={pendingState}
                                  onValueChange={(val) => setPendingState(val as VerifyState)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="clarify">Request clarification</SelectItem>
                                    <SelectItem value="refused">Refuse</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Reason</Label>
                                <Textarea
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="Clinical reason / clarification needed…"
                                />
                              </div>
                              <Button className="w-full" onClick={() => void confirm({ ...o }, pendingState)}>
                                Submit
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
