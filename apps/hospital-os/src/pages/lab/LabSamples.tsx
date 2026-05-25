import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Barcode, Search, XCircle } from "lucide-react";
import { useHospital, type LabOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";

function trackingStatus(order: LabOrder): string {
  if (order.stage === "In Analysis" || order.sampleStatus === "Processing") return "In Analysis";
  if (order.sampleStatus === "Received") return "Received";
  if (order.sampleStatus === "Collected") return "Collected";
  if (order.sampleStatus === "Analysis Complete") return "Analysis Complete";
  return "Collected";
}

const statusColor = (s: string) => {
  if (s === "Analysis Complete") return "default";
  if (s === "In Analysis") return "secondary";
  return "outline";
};

export default function LabSamples() {
  const { labOrders, updateLabOrder, updateLabStage } = useHospital();
  useDepartmentWorklistSync("lab");
  const [search, setSearch] = useState("");

  const activeSamples = useMemo(
    () =>
      labOrders.filter(
        (o) => o.stage !== "Reported" && o.stage !== "Validated",
      ),
    [labOrders],
  );

  const reportedForStorage = useMemo(
    () => labOrders.filter((o) => o.stage === "Reported").slice(0, 12),
    [labOrders],
  );

  const filtered = activeSamples.filter((order) => {
    const q = search.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(q) ||
      order.uhid.toLowerCase().includes(q) ||
      (order.sampleId || order.orderId).toLowerCase().includes(q)
    );
  });

  const receiveSample = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Received" });
  };

  const startProcessing = (order: LabOrder) => {
    updateLabOrder(order.orderId, { sampleStatus: "Processing" });
    updateLabStage(order.orderId, "In Analysis");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Samples</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sample tracking from branch worklist — receive and processing use governed platform transitions when linked
        </p>
      </div>

      <Tabs defaultValue="tracking">
        <TabsList>
          <TabsTrigger value="tracking">
            <Barcode className="h-3.5 w-3.5 mr-1" /> Sample Tracking ({activeSamples.length})
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Archive className="h-3.5 w-3.5 mr-1" /> Archived reports ({reportedForStorage.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sample ID, patient, UHID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Specimen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        No samples in tracking. Orders appear when doctors request tests.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((order) => {
                      const status = trackingStatus(order);
                      return (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-sm">{order.sampleId || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{order.patientName}</p>
                            <p className="text-xs text-muted-foreground">{order.uhid}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {order.specimenType || "Blood"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor(status)} className="text-xs">
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-1">
                            {(order.sampleStatus === "Ordered" || order.sampleStatus === "Collected") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => receiveSample(order)}
                              >
                                Receive
                              </Button>
                            )}
                            {(order.sampleStatus === "Received" || status === "Received") && (
                              <Button size="sm" className="text-xs h-7" onClick={() => startProcessing(order)}>
                                Process
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportedForStorage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                        No reported orders archived yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportedForStorage.map((o) => (
                      <TableRow key={o.orderId}>
                        <TableCell className="font-mono text-sm">{o.orderId}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{o.patientName}</p>
                          <p className="text-xs text-muted-foreground">{o.uhid}</p>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{o.tests}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.reportedAt || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border border-l-4 border-l-muted">
        <CardContent className="p-4 flex gap-2 items-start">
          <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Rejected-sample workflow and long-term biobank storage remain local-only until domain sample rejection APIs are wired.
            Use worklist and verification for governed QC paths.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
