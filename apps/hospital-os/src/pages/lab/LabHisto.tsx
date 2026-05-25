import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Microscope, ChevronRight } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { sectionForCategory } from "./labReferenceData";

const HISTO_STAGES = [
  "Grossing",
  "Processing",
  "Embedding",
  "Sectioning",
  "Staining",
  "Reporting",
  "Signed out",
] as const;

type HistoStage = (typeof HISTO_STAGES)[number];

export default function LabHisto() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const specimens = useMemo(
    () =>
      labOrders.filter(
        (o) => sectionForCategory(o.category) === "Histopathology" && o.stage !== "Reported",
      ),
    [labOrders],
  );

  const [stageMap, setStageMap] = useState<Record<string, HistoStage>>({});

  const stageOf = (orderId: string): HistoStage => stageMap[orderId] ?? "Grossing";

  const advance = (orderId: string) => {
    const current = stageOf(orderId);
    const idx = HISTO_STAGES.indexOf(current);
    if (idx >= HISTO_STAGES.length - 1) return;
    const next = HISTO_STAGES[idx + 1];
    setStageMap((prev) => ({ ...prev, [orderId]: next }));
    toast.success(`Advanced to ${next}`);
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Histopathology"
          detail={`${specimens.length} specimen(s) in the histo workflow`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Histopathology &amp; cytology</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tissue specimen workflow: grossing → processing → embedding → sectioning → staining → reporting.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Histopathology scope</AlertTitle>
        <AlertDescription className="text-xs">
          Specimens are sourced from histopathology-category orders. Block/slide tracking, grossing dictation, and
          synoptic CAP reporting are a planned specialty module (lab W9).
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {HISTO_STAGES.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px]">{s}</Badge>
            {i < HISTO_STAGES.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
          </span>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Microscope className="h-4 w-4" /> Specimens ({specimens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specimen</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {specimens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No active histopathology specimens. Biopsy / cytology orders appear here.
                  </TableCell>
                </TableRow>
              ) : (
                specimens.map((o) => {
                  const stage = stageOf(o.orderId);
                  const done = stage === "Signed out";
                  return (
                    <TableRow key={o.orderId}>
                      <TableCell className="font-mono text-sm">{o.sampleId ?? o.orderId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                        <p className="text-xs text-muted-foreground">{o.uhid}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{o.tests}</TableCell>
                      <TableCell>
                        <Badge variant={done ? "outline" : "secondary"} className="text-xs">{stage}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={done}
                          onClick={() => advance(o.orderId)}
                        >
                          {done ? "Complete" : "Advance"}
                        </Button>
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
