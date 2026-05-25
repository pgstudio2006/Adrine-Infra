import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Cpu, Inbox } from "lucide-react";
import { ANALYZERS } from "./labReferenceData";

const statusVariant: Record<string, "outline" | "secondary" | "destructive"> = {
  online: "outline",
  maintenance: "secondary",
  offline: "destructive",
};

export default function LabAnalyzers() {
  const online = ANALYZERS.filter((a) => a.status === "online").length;
  const pending = ANALYZERS.reduce((s, a) => s + a.pendingMessages, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analyzer interfacing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Instrument connectivity and the inbound result message inbox.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{online}/{ANALYZERS.length} online</Badge>
          <Badge variant="outline" className="text-xs">{pending} pending</Badge>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Interfacing scope</AlertTitle>
        <AlertDescription className="text-xs">
          Analyzer inventory is illustrative. Live HL7 v2 ORU / ASTM ingestion with auto result-matching is a
          planned interfacing service (lab W8). No instrument is connected in this preview.
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" /> Instruments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analyzer</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ANALYZERS.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.id}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.section}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{a.protocol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[a.status]} className="text-xs capitalize">
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{a.pendingMessages}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4" /> Inbound message inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No pending instrument messages. Connect an analyzer interface (HL7/ASTM) to receive results here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
