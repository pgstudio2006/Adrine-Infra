import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, CheckCircle, AlertTriangle, Pill } from "lucide-react";
import { useHospital, type PrescriptionOrder } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { OperationalDischargePanel } from "@/components/operations/OperationalDischargePanel";
import { canUseDischargeRuntime } from "@/runtime/discharge-runtime";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { WorklistStatusChip, type WorklistChipTone } from "@/components/diagnostics/WorklistStatusChip";

const rxStatusTone: Record<string, WorklistChipTone> = {
  Pending: "outline",
  Verified: "secondary",
  Dispensed: "default",
  "Partially dispensed": "secondary",
  Cancelled: "destructive",
};

export default function PharmacyPrescriptions() {
  const {
    prescriptions,
    admissions,
    updatePrescriptionStatus,
    dispensePrescription,
  } = useHospital();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<PrescriptionOrder | null>(null);
  const [dispenseQtys, setDispenseQtys] = useState<Record<number, number>>({});
  const [rejectNote, setRejectNote] = useState("");

  useDepartmentWorklistSync("pharmacy");

  const ipdDischargePharmacyTargets = useMemo(() => {
    return admissions.filter(
      (a) =>
        a.platformAdmissionId
        && a.status !== "discharged"
        && (a.status === "discharge-ready" || a.status === "admitted" || a.status === "icu"),
    );
  }, [admissions]);

  const filtered = prescriptions.filter(rx => {
    const matchesSearch = rx.patientName.toLowerCase().includes(search.toLowerCase()) || rx.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || rx.status === filter;
    return matchesSearch && matchesFilter;
  });

  const openDispense = (rx: PrescriptionOrder) => {
    setSelected(rx);
    const initial: Record<number, number> = {};
    rx.meds.forEach((m, i) => { initial[i] = m.qty - m.dispensed; });
    setDispenseQtys(initial);
  };

  const handleDispense = () => {
    if (selected) {
      dispensePrescription(selected.id, dispenseQtys);
      setSelected(null);
    }
  };

  const rxColumns = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: (rx: PrescriptionOrder) => (
          <WorklistStatusChip label={rx.status} tone={rxStatusTone[rx.status] ?? "outline"} />
        ),
      },
      {
        id: "patient",
        header: "Patient",
        cell: (rx: PrescriptionOrder) => (
          <div>
            <p className="text-sm font-medium">{rx.patientName}</p>
            <p className="text-xs text-muted-foreground font-mono">{rx.uhid}</p>
            <p className="text-xs text-muted-foreground font-mono">{rx.id}</p>
          </div>
        ),
      },
      {
        id: "order",
        header: "Order",
        cell: (rx: PrescriptionOrder) => (
          <div className="text-sm">
            <p>{rx.doctor}</p>
            <p className="text-xs text-muted-foreground">{rx.department} · {rx.meds.length} items</p>
          </div>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        cell: (rx: PrescriptionOrder) => (
          <WorklistStatusChip
            label={rx.priority}
            tone={rx.priority === "Emergency" ? "destructive" : rx.priority === "Urgent" ? "default" : "outline"}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: (rx: PrescriptionOrder) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelected(rx)}>
              <Eye className="h-4 w-4" />
            </Button>
            {rx.status === "Pending" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updatePrescriptionStatus(rx.id, "Verified")}
                title="Verify prescription"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            {(rx.status === "Verified" || rx.status === "Partially dispensed") && (
              <Button variant="ghost" size="icon" onClick={() => openDispense(rx)}>
                <Pill className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [updatePrescriptionStatus],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground text-sm">
          {prescriptions.filter(r => r.status === 'Pending').length} pending · {prescriptions.filter(r => r.status === 'Dispensed').length} dispensed today
        </p>
      </div>

      {canUseDischargeRuntime() && ipdDischargePharmacyTargets.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">IPD discharge — pharmacy clearance</p>
          {ipdDischargePharmacyTargets.map((admission) => {
            const rxForPatient = prescriptions.filter((rx) => rx.uhid === admission.uhid);
            const rxOutstanding = rxForPatient.filter(
              (rx) => rx.status !== "Dispensed" && rx.status !== "Cancelled",
            );
            const fulfilled =
              rxForPatient.length === 0
              || rxForPatient.every(
                (rx) => rx.status === "Dispensed" || rx.status === "Cancelled",
              );
            return (
              <OperationalDischargePanel
                key={admission.id}
                admissionId={admission.platformAdmissionId}
                patientName={admission.patientName}
                pharmacyClearanceContext={
                  fulfilled ? { ipPharmacyFulfilledOrDeferred: true } : undefined
                }
              />
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient name or Rx ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Dispensed">Dispensed</SelectItem>
            <SelectItem value="Partially dispensed">Partially Dispensed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DepartmentWorklistTable
        rows={filtered}
        columns={rxColumns}
        getRowKey={(rx) => rx.id}
        emptyMessage="No prescriptions. They appear here when doctors complete consultations."
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Prescription {selected.id}
                  <WorklistStatusChip label={selected.status} tone={rxStatusTone[selected.status] ?? "outline"} />
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selected.patientName}</span></div>
                <div><span className="text-muted-foreground">UHID:</span> {selected.uhid}</div>
                <div><span className="text-muted-foreground">Doctor:</span> {selected.doctor}</div>
                <div><span className="text-muted-foreground">Department:</span> {selected.department}</div>
              </div>

              <Tabs defaultValue="medications" className="mt-4">
                <TabsList>
                  <TabsTrigger value="medications">Medications ({selected.meds.length})</TabsTrigger>
                  <TabsTrigger value="dispense">Dispense</TabsTrigger>
                </TabsList>
                <TabsContent value="medications" className="space-y-3 mt-3">
                  {selected.meds.map((m, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                      <span className="font-medium text-foreground">{m.drug}</span>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Dose: {m.dosage}</span>
                        <span>Freq: {m.frequency}</span>
                        <span>Duration: {m.duration}</span>
                        <span>Route: {m.route}</span>
                        <span>Qty: {m.qty}</span>
                        <span>Dispensed: {m.dispensed}</span>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="dispense" className="space-y-3 mt-3">
                  {selected.meds.filter(m => m.qty - m.dispensed > 0).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">All medications fully dispensed.</p>
                  ) : (
                    <>
                      {selected.meds.map((m, i) => {
                        const remaining = m.qty - m.dispensed;
                        if (remaining <= 0) return null;
                        return (
                          <div key={i} className="flex items-center justify-between border border-border rounded-lg p-3">
                            <div>
                              <p className="font-medium text-sm text-foreground">{m.drug}</p>
                              <p className="text-xs text-muted-foreground">Remaining: {remaining} units</p>
                            </div>
                            <Input type="number" min={0} max={remaining}
                              value={dispenseQtys[i] ?? remaining}
                              onChange={e => setDispenseQtys(prev => ({ ...prev, [i]: Number(e.target.value) }))}
                              className="w-20" />
                          </div>
                        );
                      })}
                      <Button className="w-full" onClick={handleDispense}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Dispense
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
