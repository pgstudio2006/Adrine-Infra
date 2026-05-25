import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FlaskConical, Search } from "lucide-react";
import { LAB_SECTIONS, TEST_CATALOG, flagResult } from "./labReferenceData";

const inr = (cents: number) => `₹${(cents / 100).toLocaleString("en-IN")}`;

export default function LabCatalog() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [flagTest, setFlagTest] = useState(TEST_CATALOG.find((t) => t.refLow !== undefined)?.code ?? "HB");
  const [flagValue, setFlagValue] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEST_CATALOG.filter(
      (t) =>
        (section === "all" || t.section === section) &&
        (!q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.loinc.includes(q)),
    );
  }, [search, section]);

  const flaggableTests = TEST_CATALOG.filter((t) => t.refLow !== undefined && t.refHigh !== undefined);
  const flagOutcome = useMemo(() => {
    const v = Number(flagValue);
    if (!flagValue.trim() || !Number.isFinite(v)) return null;
    return flagResult(flagTest, v);
  }, [flagTest, flagValue]);
  const flagTestDef = TEST_CATALOG.find((t) => t.code === flagTest);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Test catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            LOINC-mapped tests with specimen, container, reference range, TAT, and tariff.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">Catalog source</AlertTitle>
        <AlertDescription className="text-xs">
          This is an illustrative master catalog. A production catalog (panels, reflex rules, age/sex ranges, price
          lists) is sourced from the domain test-catalog service — orders today carry a free-text test string
          (ENTERPRISE_AUDIT_REPORT.md §4.9, lab W2).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" /> Reference-range flag checker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label>Test</Label>
              <Select value={flagTest} onValueChange={setFlagTest}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {flaggableTests.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.name} ({t.refLow}–{t.refHigh} {t.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value {flagTestDef?.unit ? `(${flagTestDef.unit})` : ""}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={flagValue}
                onChange={(e) => setFlagValue(e.target.value)}
                placeholder="Enter result value"
              />
            </div>
            <div className="pb-0.5">
              {flagOutcome ? (
                <Badge
                  variant={flagOutcome === "N" ? "outline" : "destructive"}
                  className="text-sm"
                >
                  {flagOutcome === "H" ? "HIGH (H)" : flagOutcome === "L" ? "LOW (L)" : "Normal (N)"}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Enter a value</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search test name, code, or LOINC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {LAB_SECTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tests ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>LOINC</TableHead>
                <TableHead>Specimen / container</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">TAT</TableHead>
                <TableHead className="text-right">Tariff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.code}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.code} · <Badge variant="outline" className="text-[10px]">{t.section}</Badge>
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.loinc}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.specimen} · {t.container}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.refLow !== undefined ? `${t.refLow}–${t.refHigh} ${t.unit}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{t.tatHours}h</TableCell>
                  <TableCell className="text-right text-sm">{inr(t.tariffCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
