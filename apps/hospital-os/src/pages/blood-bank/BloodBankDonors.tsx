import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DONORS } from "./bloodBankReferenceData";

export default function BloodBankDonors() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Donor Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Registration, eligibility screening, deferral, and camp recall.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Donor registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last donation</TableHead>
                <TableHead>Eligibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DONORS.map((donor) => (
                <TableRow key={donor.donorId}>
                  <TableCell className="font-mono text-sm">{donor.donorId}</TableCell>
                  <TableCell>
                    <p className="font-medium">{donor.name}</p>
                    <p className="text-xs text-muted-foreground">{donor.age}y · {donor.gender}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{donor.bloodGroup}</Badge></TableCell>
                  <TableCell className="text-sm">{donor.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{donor.lastDonation || "—"}</TableCell>
                  <TableCell>
                    {donor.eligible ? (
                      <Badge className="text-xs">Eligible</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">{donor.deferralReason}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
