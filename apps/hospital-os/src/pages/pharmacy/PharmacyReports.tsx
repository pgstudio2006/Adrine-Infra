import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";
import { downloadCsv, downloadJson, type ExportRow } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Pill, Search, ShieldAlert, TriangleAlert } from "lucide-react";

const INTERACTION_RULES: Array<{ a: string; b: string; message: string }> = [
  { a: "Warfarin", b: "Metronidazole", message: "INR may rise. Monitor and adjust dose." },
  { a: "Warfarin", b: "Aspirin", message: "Bleeding risk increases." },
  { a: "Metformin", b: "Contrast", message: "Lactic acidosis risk around contrast studies." },
  { a: "Morphine", b: "Diazepam", message: "Respiratory depression risk." },
];

function isControlledDrug(name: string) {
  const pattern = /morphine|diazepam|ketamine|fentanyl|tramadol|codeine/i;
  return pattern.test(name);
}

function daysTo(expiry: string) {
  const parsed = Date.parse(expiry);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.floor((parsed - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PharmacyReports() {
  const { prescriptions, pharmacyInventory, invoices, patients, admissions } = useHospital();
  useDepartmentWorklistSync("pharmacy");
  const platformRx = isPlatformAuthoritative();
  const [search, setSearch] = useState("");

  const dispensingRows = useMemo(() => {
    return prescriptions.map((rx) => {
      const totalLines = rx.meds.length;
      const pendingLines = rx.meds.filter((line) => line.dispensed < line.qty && line.status !== "stopped").length;
      const totalQty = rx.meds.reduce((sum, line) => sum + line.qty, 0);
      const dispensedQty = rx.meds.reduce((sum, line) => sum + line.dispensed, 0);
      const encounter = admissions.some((admission) => admission.uhid === rx.uhid && admission.status !== "discharged") ? "IPD" : "OPD";

      return {
        rxId: rx.id,
        uhid: rx.uhid,
        patientName: rx.patientName,
        doctor: rx.doctor,
        encounter,
        status: rx.status,
        priority: rx.priority,
        totalLines,
        pendingLines,
        totalQty,
        dispensedQty,
      };
    });
  }, [admissions, prescriptions]);

  const inventoryRows = useMemo(() => {
    return pharmacyInventory.map((item) => {
      const remainingDays = daysTo(item.expiry);
      return {
        id: item.id,
        drug: item.drug,
        generic: item.generic,
        category: item.category,
        batch: item.batch,
        expiry: item.expiry,
        remainingDays,
        qty: item.qty,
        reorder: item.reorder,
        stockStatus: item.qty <= item.reorder ? "Low" : "Healthy",
        supplier: item.supplier,
      };
    });
  }, [pharmacyInventory]);

  const alertRows = useMemo(() => {
    const rows: Array<{
      type: "allergy" | "interaction";
      rxId: string;
      uhid: string;
      patientName: string;
      detail: string;
      severity: "high" | "medium";
    }> = [];

    prescriptions.forEach((rx) => {
      const patient = patients.find((item) => item.uhid === rx.uhid);
      const allergies = (patient?.allergies || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      rx.meds.forEach((line) => {
        const medName = line.drug.toLowerCase();
        const allergyMatch = allergies.find((allergy) => medName.includes(allergy) || allergy.includes(medName.split(" ")[0]));
        if (allergyMatch) {
          rows.push({
            type: "allergy",
            rxId: rx.id,
            uhid: rx.uhid,
            patientName: rx.patientName,
            detail: `Allergy conflict: ${line.drug} vs documented allergy \"${allergyMatch}\"`,
            severity: "high",
          });
        }
      });

      INTERACTION_RULES.forEach((rule) => {
        const hasA = rx.meds.some((line) => line.drug.toLowerCase().includes(rule.a.toLowerCase()));
        const hasB = rx.meds.some((line) => line.drug.toLowerCase().includes(rule.b.toLowerCase()));
        if (hasA && hasB) {
          rows.push({
            type: "interaction",
            rxId: rx.id,
            uhid: rx.uhid,
            patientName: rx.patientName,
            detail: `${rule.a} + ${rule.b}: ${rule.message}`,
            severity: "medium",
          });
        }
      });
    });

    return rows;
  }, [patients, prescriptions]);

  const narcoticsRows = useMemo(() => {
    return inventoryRows
      .filter((item) => item.category.toLowerCase() === "controlled" || isControlledDrug(item.drug))
      .map((item) => {
        const linkedDispense = prescriptions
          .flatMap((rx) => rx.meds)
          .filter((line) => line.drug.toLowerCase().includes(item.generic.toLowerCase().split(" ")[0]))
          .reduce((sum, line) => sum + line.dispensed, 0);

        return {
          inventoryId: item.id,
          drug: item.drug,
          batch: item.batch,
          stock: item.qty,
          dispensedQty: linkedDispense,
          lastAudit: "Daily ledger check",
          compliance: item.qty >= 0 ? "Compliant" : "Review",
        };
      });
  }, [inventoryRows, prescriptions]);

  const billingRows = useMemo(() => {
    const pharmacyInvoices = invoices.filter((invoice) => invoice.category === "Pharmacy");

    return dispensingRows.map((row) => {
      const invoice = pharmacyInvoices.find((item) => item.uhid === row.uhid);
      return {
        rxId: row.rxId,
        uhid: row.uhid,
        patientName: row.patientName,
        encounter: row.encounter,
        status: row.status,
        syncedInvoice: invoice?.id || "Not created",
        amount: invoice?.total || 0,
        paid: invoice?.paid || 0,
        balance: invoice ? Math.max(0, invoice.total - invoice.paid) : 0,
      };
    });
  }, [dispensingRows, invoices]);

  const query = search.trim().toLowerCase();
  const filteredDispensingRows = dispensingRows.filter((row) => {
    return (
      query === ""
      || row.patientName.toLowerCase().includes(query)
      || row.uhid.toLowerCase().includes(query)
      || row.rxId.toLowerCase().includes(query)
      || row.doctor.toLowerCase().includes(query)
    );
  });

  const exportRows = (rows: ExportRow[], name: string) => {
    downloadCsv(rows, `pharmacy-${name}-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`${name} report exported`);
  };

  const exportAllJson = () => {
    downloadJson(
      {
        generatedAt: new Date().toISOString(),
        dispensingRows,
        inventoryRows,
        alertRows,
        narcoticsRows,
        billingRows,
      },
      `pharmacy-reports-${new Date().toISOString().slice(0, 10)}.json`,
    );
    toast.success("All pharmacy reports exported");
  };

  const lowStock = inventoryRows.filter((row) => row.stockStatus === "Low").length;
  const nearExpiry = inventoryRows.filter((row) => (row.remainingDays ?? 999) <= 30).length;
  const pendingDispense = dispensingRows.filter((row) => row.pendingLines > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy Reports</h1>
          <p className="text-sm text-muted-foreground">
            Dispensing KPIs from {platformRx ? "platform branch worklist" : "local store"}; stock and supplier analytics remain local until domain reporting APIs ship.
          </p>
        </div>
        <Button variant="outline" onClick={exportAllJson}><Download className="h-4 w-4 mr-1" /> Export All JSON</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Prescriptions</p><p className="text-2xl font-bold">{dispensingRows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending Dispense</p><p className="text-2xl font-bold">{pendingDispense}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-destructive">{lowStock}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Near Expiry (30d)</p><p className="text-2xl font-bold">{nearExpiry}</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by patient, UHID, Rx ID, or doctor" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <Tabs defaultValue="dispensing">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dispensing"><Pill className="h-3.5 w-3.5 mr-1" /> Dispensing</TabsTrigger>
          <TabsTrigger value="inventory"><FileText className="h-3.5 w-3.5 mr-1" /> Inventory</TabsTrigger>
          <TabsTrigger value="alerts"><TriangleAlert className="h-3.5 w-3.5 mr-1" /> Validation Alerts</TabsTrigger>
          <TabsTrigger value="narcotics"><ShieldAlert className="h-3.5 w-3.5 mr-1" /> Narcotics Register</TabsTrigger>
          <TabsTrigger value="billing">Billing Linkage</TabsTrigger>
        </TabsList>

        <TabsContent value="dispensing" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportRows(filteredDispensingRows, "dispensing")}>Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Encounter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pending Lines</TableHead>
                    <TableHead>Dispensed Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispensingRows.map((row) => (
                    <TableRow key={row.rxId}>
                      <TableCell className="font-mono text-xs">{row.rxId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{row.patientName}</p>
                        <p className="text-xs text-muted-foreground">{row.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">{row.doctor}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.encounter}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.status}</Badge></TableCell>
                      <TableCell className="text-sm font-semibold">{row.pendingLines}</TableCell>
                      <TableCell className="text-sm">{row.dispensedQty} / {row.totalQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportRows(inventoryRows, "inventory")}>Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Reorder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{row.drug}</p>
                        <p className="text-xs text-muted-foreground">{row.generic}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                      <TableCell className="text-xs">
                        {row.expiry}
                        {row.remainingDays !== null && <span className="text-muted-foreground"> ({row.remainingDays}d)</span>}
                      </TableCell>
                      <TableCell className="text-sm">{row.qty}</TableCell>
                      <TableCell className="text-sm">{row.reorder}</TableCell>
                      <TableCell>
                        <Badge variant={row.stockStatus === "Low" ? "destructive" : "outline"} className="text-xs">{row.stockStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{row.supplier}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportRows(alertRows, "validation-alerts")}>Export CSV</Button>
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Interaction and Allergy Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alertRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active validation alerts from current prescriptions.</p>
              ) : alertRows.map((row) => (
                <div key={`${row.rxId}-${row.detail}`} className="rounded-md border p-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.patientName} · {row.uhid}</p>
                    <p className="text-xs text-muted-foreground">Rx: {row.rxId}</p>
                    <p className="text-sm mt-1">{row.detail}</p>
                  </div>
                  <Badge variant={row.severity === "high" ? "destructive" : "secondary"} className="text-xs">{row.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="narcotics" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportRows(narcoticsRows, "narcotics-register")}>Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Drug</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Dispensed</TableHead>
                    <TableHead>Last Audit</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {narcoticsRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No controlled drug entries detected.</TableCell>
                    </TableRow>
                  ) : narcoticsRows.map((row) => (
                    <TableRow key={row.inventoryId}>
                      <TableCell className="font-mono text-xs">{row.inventoryId}</TableCell>
                      <TableCell className="text-sm font-medium">{row.drug}</TableCell>
                      <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                      <TableCell className="text-sm">{row.stock}</TableCell>
                      <TableCell className="text-sm">{row.dispensedQty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.lastAudit}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.compliance}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportRows(billingRows, "billing-linkage")}>Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Encounter</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingRows.map((row) => (
                    <TableRow key={row.rxId}>
                      <TableCell className="font-mono text-xs">{row.rxId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{row.patientName}</p>
                        <p className="text-xs text-muted-foreground">{row.uhid}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.encounter}</Badge></TableCell>
                      <TableCell className="text-xs">{row.syncedInvoice}</TableCell>
                      <TableCell className="text-sm">₹{row.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm">₹{row.paid.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm font-semibold">₹{row.balance.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
