import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REQUISITIONS } from "./bloodBankReferenceData";

export default function BloodBankIssue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issue & Transfusion</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Requisition, cross-match, issue, return, and haemovigilance tracking.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active requisitions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Req ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Group / Component</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Cross-match</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REQUISITIONS.map((req) => (
                <TableRow key={req.reqId}>
                  <TableCell className="font-mono text-sm">{req.reqId}</TableCell>
                  <TableCell>
                    <p className="font-medium">{req.patientName}</p>
                    <p className="text-xs text-muted-foreground">{req.uhid}</p>
                  </TableCell>
                  <TableCell className="text-sm">{req.ward}</TableCell>
                  <TableCell className="text-sm">{req.bloodGroup} · {req.component}</TableCell>
                  <TableCell>{req.units}</TableCell>
                  <TableCell>
                    <Badge variant={req.urgency === "Emergency" ? "destructive" : "outline"} className="text-xs">
                      {req.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{req.crossMatch || "Pending"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{req.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
