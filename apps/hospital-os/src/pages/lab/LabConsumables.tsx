import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { FlaskRound, PackagePlus } from "lucide-react";
import { REAGENTS } from "./labReferenceData";

export default function LabConsumables() {
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const lowStock = useMemo(() => REAGENTS.filter((r) => r.onHand <= r.reorderLevel).length, []);

  const raiseIndent = (code: string, name: string) => {
    setRequested((prev) => ({ ...prev, [code]: true }));
    toast.success("Indent raised", { description: `Reorder request for ${name} sent to inventory.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reagents &amp; consumables</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bench reagent levels with low-stock alerts and reorder requests to inventory.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/inventory/requisitions">Open inventory</Link>
        </Button>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Consumables scope</AlertTitle>
        <AlertDescription className="text-xs">
          Reagent levels are illustrative. Reorder raises a requisition signal only — lot/expiry cold-chain tracking
          and auto-reorder live in the inventory domain (lab W-consumables backlog).
        </AlertDescription>
      </Alert>

      {lowStock > 0 && (
        <Alert variant="destructive">
          <AlertTitle className="text-sm">{lowStock} reagent(s) at or below reorder level</AlertTitle>
          <AlertDescription className="text-xs">Raise an indent to inventory to avoid bench downtime.</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskRound className="h-4 w-4" /> Reagent stock
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reagent</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Lot / expiry</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {REAGENTS.map((r) => {
                const low = r.onHand <= r.reorderLevel;
                return (
                  <TableRow key={r.code}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.section}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.lot} · exp {r.expiry}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm ${low ? "font-bold text-destructive" : "text-foreground"}`}>
                        {r.onHand} {r.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {r.reorderLevel} {r.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {low ? (
                        requested[r.code] ? (
                          <Badge variant="outline" className="text-xs">Requested</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => raiseIndent(r.code, r.name)}>
                            <PackagePlus className="mr-1 h-3.5 w-3.5" />
                            Indent
                          </Button>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
