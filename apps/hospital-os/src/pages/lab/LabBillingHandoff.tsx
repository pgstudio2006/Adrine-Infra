import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Receipt, Search } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { estimateTariffCents } from "./labReferenceData";

const inr = (cents: number) =>
  `₹${(cents / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function LabBillingHandoff() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return labOrders
      .filter((o) => o.stage !== "Reported")
      .filter((o) => !q || o.patientName.toLowerCase().includes(q) || o.uhid.toLowerCase().includes(q) || o.tests.toLowerCase().includes(q))
      .map((o) => {
        const est = estimateTariffCents(o.tests);
        return { order: o, lines: est.matched, total: est.total };
      });
  }, [labOrders, search]);

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows]);

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Billing handoff"
          detail={`${rows.length} active order(s) · estimated ${inr(grandTotal)} pending charge`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing handoff</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Charge preview for active orders before report release, for reconciliation with billing.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/billing-dept/invoices">Open billing</Link>
        </Button>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Estimated charges</AlertTitle>
        <AlertDescription className="text-xs">
          Amounts are estimated from the local test tariff master. Authoritative charge lines are posted via the
          domain billing-sync service when an order is created/released (lab W6 reconciliation).
        </AlertDescription>
      </Alert>

      <div className="relative md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient, UHID, or test…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" /> Pending charges ({rows.length})
          </CardTitle>
          <Badge variant="outline" className="text-sm">Total: {inr(grandTotal)}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Tests (matched tariff)</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No active orders pending charge.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ order, lines, total }) => (
                  <TableRow key={order.orderId}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{order.patientName}</p>
                      <p className="text-xs text-muted-foreground">{order.uhid}</p>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="flex flex-wrap gap-1">
                        {lines.map((l, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {l.name} · {inr(l.cents)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{order.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{inr(total)}</TableCell>
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
