import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { LAB_SECTIONS, sectionForCategory, type LabSection } from "./labReferenceData";

export default function LabSections() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const bySection = useMemo(() => {
    const map = new Map<LabSection, typeof labOrders>();
    for (const s of LAB_SECTIONS) map.set(s, []);
    for (const o of labOrders) {
      if (o.stage === "Reported") continue;
      const s = sectionForCategory(o.category);
      map.get(s)!.push(o);
    }
    return map;
  }, [labOrders]);

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Section worklists"
          detail="Active orders zoned by laboratory section from the branch worklist"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Section worklists</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hematology, biochemistry, microbiology, serology, and histopathology benches.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/lab/worklist">Full worklist</Link>
        </Button>
      </div>

      <Tabs defaultValue={LAB_SECTIONS[0]}>
        <TabsList className="flex-wrap">
          {LAB_SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s}
              <Badge variant="outline" className="ml-1.5 text-[10px]">{bySection.get(s)!.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {LAB_SECTIONS.map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sample</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bySection.get(s)!.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No active orders in {s}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bySection.get(s)!.map((o) => (
                        <TableRow key={o.orderId}>
                          <TableCell className="font-mono text-sm">{o.sampleId ?? o.orderId}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                            <p className="text-xs text-muted-foreground">{o.uhid}</p>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm">{o.tests}</TableCell>
                          <TableCell>
                            <Badge variant={o.priority === "Emergency" ? "destructive" : o.priority === "Urgent" ? "secondary" : "outline"} className="text-xs">
                              {o.priority}
                            </Badge>
                          </TableCell>
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
