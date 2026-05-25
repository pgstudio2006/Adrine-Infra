import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Droplet, Printer, Syringe } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { sectionForCategory } from "./labReferenceData";

function makeSampleId(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `S${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function LabPhlebotomy() {
  const { labOrders, updateLabOrder } = useHospital();
  const { user } = useAuth();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();
  const collector = user?.name ?? "Phlebotomist";

  const [labelFor, setLabelFor] = useState<string | null>(null);

  const queue = useMemo(
    () => labOrders.filter((o) => o.sampleStatus === "Ordered"),
    [labOrders],
  );

  const labelOrder = labOrders.find((o) => o.orderId === labelFor) ?? null;

  const collect = (orderId: string) => {
    const sampleId = makeSampleId();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    updateLabOrder(orderId, {
      sampleStatus: "Collected",
      sampleId,
      comments: `Collected by ${collector} at ${time}`,
    });
    setLabelFor(orderId);
    toast.success("Sample collected", { description: `Sample ${sampleId} labelled and queued for accession.` });
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Phlebotomy collection"
          detail={`${queue.length} order(s) awaiting collection`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Phlebotomy collection queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Draw samples, generate the sample label, and hand off to the accession desk.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Collection scope</AlertTitle>
        <AlertDescription className="text-xs">
          Collection updates the order sample status locally and prints a label. Barcode label hardware and a
          dedicated phlebotomy domain service are planned (lab W3).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-4 w-4" /> Awaiting collection ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No samples awaiting collection.
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((o) => (
                  <TableRow key={o.orderId}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                      <p className="text-xs text-muted-foreground">{o.uhid}</p>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">{o.tests}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sectionForCategory(o.category)}</TableCell>
                    <TableCell>
                      <Badge variant={o.priority === "Emergency" ? "destructive" : o.priority === "Urgent" ? "secondary" : "outline"} className="text-xs">
                        {o.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="h-7 text-xs" onClick={() => collect(o.orderId)}>
                        <Droplet className="mr-1 h-3.5 w-3.5" />
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(labelFor)} onOpenChange={(v) => !v && setLabelFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sample label</DialogTitle>
          </DialogHeader>
          {labelOrder ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border-2 border-dashed border-foreground/30 p-4 font-mono">
                <p className="text-sm font-bold">{labelOrder.patientName}</p>
                <p className="text-xs text-muted-foreground">{labelOrder.uhid}</p>
                <div className="my-2 h-10 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px)]" />
                <p className="text-center text-sm font-bold tracking-widest">{labelOrder.sampleId}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sectionForCategory(labelOrder.category)} · {labelOrder.tests}
                </p>
                <p className="text-[10px] text-muted-foreground">{labelOrder.comments}</p>
              </div>
              <Button className="w-full" onClick={() => window.print()}>
                <Printer className="mr-1 h-4 w-4" />
                Print label
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
