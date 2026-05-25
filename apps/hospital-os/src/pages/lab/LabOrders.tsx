import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox, Search } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const priorityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  Emergency: "destructive",
  Urgent: "secondary",
  Routine: "outline",
};

type Bucket = "all" | "awaiting" | "collected" | "processing" | "validation" | "reported";

export default function LabOrders() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<Bucket>("all");

  const counts = useMemo(() => {
    const awaiting = labOrders.filter((o) => o.sampleStatus === "Ordered").length;
    const collected = labOrders.filter((o) => o.sampleStatus === "Collected").length;
    const processing = labOrders.filter(
      (o) => o.sampleStatus === "Received" || o.sampleStatus === "Processing" || o.stage === "In Analysis",
    ).length;
    const validation = labOrders.filter((o) => o.stage === "Awaiting Validation").length;
    const reported = labOrders.filter((o) => o.stage === "Reported").length;
    return { awaiting, collected, processing, validation, reported };
  }, [labOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return labOrders.filter((o) => {
      const matchSearch =
        !q ||
        o.patientName.toLowerCase().includes(q) ||
        o.uhid.toLowerCase().includes(q) ||
        o.tests.toLowerCase().includes(q) ||
        o.doctor.toLowerCase().includes(q);
      const matchBucket =
        bucket === "all" ||
        (bucket === "awaiting" && o.sampleStatus === "Ordered") ||
        (bucket === "collected" && o.sampleStatus === "Collected") ||
        (bucket === "processing" &&
          (o.sampleStatus === "Received" || o.sampleStatus === "Processing" || o.stage === "In Analysis")) ||
        (bucket === "validation" && o.stage === "Awaiting Validation") ||
        (bucket === "reported" && o.stage === "Reported");
      return matchSearch && matchBucket;
    });
  }, [labOrders, search, bucket]);

  const tiles: { key: Bucket; label: string; value: number }[] = [
    { key: "awaiting", label: "Awaiting collection", value: counts.awaiting },
    { key: "collected", label: "Collected", value: counts.collected },
    { key: "processing", label: "In process", value: counts.processing },
    { key: "validation", label: "Awaiting validation", value: counts.validation },
    { key: "reported", label: "Reported", value: counts.reported },
  ];

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Lab orders inbox"
          detail={`${labOrders.length} order(s) in branch worklist`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Clinical order intake across OPD, IPD, and emergency — separate from the bench worklist.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/lab/worklist">Open bench worklist</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <button key={t.key} type="button" onClick={() => setBucket(bucket === t.key ? "all" : t.key)} className="text-left">
            <Card className={`border-border transition-colors hover:bg-muted/40 ${bucket === t.key ? "ring-1 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{t.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient, UHID, test, or doctor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={bucket} onValueChange={(v) => setBucket(v as Bucket)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            <SelectItem value="awaiting">Awaiting collection</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="processing">In process</SelectItem>
            <SelectItem value="validation">Awaiting validation</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" /> Orders ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No orders match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.orderId}>
                    <TableCell>
                      <p className="font-mono text-sm text-foreground">{o.orderId}</p>
                      <p className="text-xs text-muted-foreground">{o.orderTime}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                      <p className="text-xs text-muted-foreground">{o.uhid}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{o.tests}</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[o.priority] ?? "outline"} className="text-xs">
                        {o.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.sampleStatus}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{o.stage}</Badge>
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
