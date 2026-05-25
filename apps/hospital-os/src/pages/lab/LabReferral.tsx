import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Send, Truck } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const PARTNER_LABS = ["SRL Diagnostics", "Metropolis", "Dr Lal PathLabs", "Thyrocare", "Neuberg"];

type Referral = {
  id: string;
  orderId: string;
  patientName: string;
  tests: string;
  partner: string;
  status: "sent" | "received" | "reported";
  externalRef: string;
  at: string;
};

let seq = 0;

export default function LabReferral() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const active = useMemo(() => labOrders.filter((o) => o.stage !== "Reported"), [labOrders]);

  const [orderId, setOrderId] = useState("");
  const [partner, setPartner] = useState(PARTNER_LABS[0]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const sendOut = () => {
    const order = active.find((o) => o.orderId === orderId);
    if (!order) {
      toast.error("Select an order to send out.");
      return;
    }
    setReferrals((prev) => [
      {
        id: `ref-${Date.now()}-${seq++}`,
        orderId: order.orderId,
        patientName: order.patientName,
        tests: order.tests,
        partner,
        status: "sent",
        externalRef: `${partner.split(" ")[0].toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        at: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    toast.success("Referral sent", { description: `${order.tests} sent to ${partner}.` });
  };

  const advance = (id: string, status: Referral["status"]) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Referral marked ${status}`);
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Referral / outsource"
          detail={`${referrals.length} send-out(s) tracked this session`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Referral &amp; outsource</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track tests sent to external/partner laboratories and their returned reports.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Referral scope</AlertTitle>
        <AlertDescription className="text-xs">
          Send-outs are tracked locally. Electronic order transmission (HL7 outbound / SFTP) and external report
          attachment are planned (lab W7).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" /> Send out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label>Order</Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order to outsource" />
                </SelectTrigger>
                <SelectContent>
                  {active.map((o) => (
                    <SelectItem key={o.orderId} value={o.orderId}>
                      {o.patientName} · {o.tests}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Partner lab</Label>
              <Select value={partner} onValueChange={setPartner}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_LABS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendOut}>
              <Truck className="mr-1 h-4 w-4" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Outstanding referrals ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>External ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No referrals sent.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.patientName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{r.tests}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.partner}</TableCell>
                    <TableCell className="font-mono text-xs">{r.externalRef}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "reported" ? "outline" : "secondary"} className="text-xs capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "sent" ? (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => advance(r.id, "received")}>
                          Mark received
                        </Button>
                      ) : r.status === "received" ? (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => advance(r.id, "reported")}>
                          Attach report
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Complete</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
