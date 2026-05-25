import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Snowflake, MapPin } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const FREEZERS = ["Freezer A (-20°C)", "Freezer B (-80°C)", "Fridge 1 (2-8°C)", "Ambient rack"];

type Location = { freezer: string; rack: string; position: string };

export default function LabStorage() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [freezer, setFreezer] = useState(FREEZERS[0]);
  const [rack, setRack] = useState("");
  const [position, setPosition] = useState("");

  const stored = useMemo(
    () =>
      labOrders.filter(
        (o) => o.sampleStatus === "Received" || o.sampleStatus === "Processing" || o.sampleStatus === "Analysis Complete",
      ),
    [labOrders],
  );

  const openAssign = (orderId: string) => {
    const existing = locations[orderId];
    setFreezer(existing?.freezer ?? FREEZERS[0]);
    setRack(existing?.rack ?? "");
    setPosition(existing?.position ?? "");
    setAssignFor(orderId);
  };

  const save = (orderId: string) => {
    if (!rack.trim() || !position.trim()) {
      toast.error("Enter rack and position.");
      return;
    }
    setLocations((prev) => ({ ...prev, [orderId]: { freezer, rack: rack.trim(), position: position.trim() } }));
    setAssignFor(null);
    toast.success("Storage location assigned", { description: `${freezer} · rack ${rack} · ${position}` });
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Sample storage"
          detail={`${stored.length} sample(s) in the lab · ${Object.keys(locations).length} located`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sample storage</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track freezer / rack / position for received samples and retained specimens.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Storage scope</AlertTitle>
        <AlertDescription className="text-xs">
          Storage positions are tracked locally for the shift. A biobank/retention service with cold-chain logging
          is a planned domain feature (lab W-storage backlog).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="h-4 w-4" /> Samples in lab ({stored.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Location</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stored.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No samples currently in the lab.
                  </TableCell>
                </TableRow>
              ) : (
                stored.map((o) => {
                  const loc = locations[o.orderId];
                  return (
                    <TableRow key={o.orderId}>
                      <TableCell className="font-mono text-sm">{o.sampleId ?? o.orderId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                        <p className="text-xs text-muted-foreground">{o.tests}</p>
                      </TableCell>
                      <TableCell>
                        {loc ? (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="mr-1 h-3 w-3" />
                            {loc.freezer} · {loc.rack}/{loc.position}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openAssign(o.orderId)}>
                          {loc ? "Move" : "Assign"}
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

      <Dialog open={Boolean(assignFor)} onOpenChange={(v) => !v && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign storage location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Freezer / unit</Label>
              <Select value={freezer} onValueChange={setFreezer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREEZERS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rack</Label>
                <Input value={rack} onChange={(e) => setRack(e.target.value)} placeholder="e.g. R3" />
              </div>
              <div>
                <Label>Position</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. B7" />
              </div>
            </div>
            <Button className="w-full" onClick={() => assignFor && save(assignFor)}>
              Save location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
