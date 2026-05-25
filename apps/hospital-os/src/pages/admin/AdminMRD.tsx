import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useHospital } from "@/stores/hospitalStore";
import { downloadCsv, downloadJson } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Archive, Clock, Shield, Paperclip, Download } from "lucide-react";

type TabKey = "records" | "workflow" | "templates" | "retention" | "audit";

const RETENTION_POLICIES = [
  { recordType: "OPD Records", retentionYears: 5, archiveAfter: "3 years", purgePolicy: "After 5 years" },
  { recordType: "IPD Records", retentionYears: 10, archiveAfter: "5 years", purgePolicy: "After 10 years" },
  { recordType: "Surgical Records", retentionYears: 15, archiveAfter: "7 years", purgePolicy: "After 15 years" },
  { recordType: "Lab Reports", retentionYears: 5, archiveAfter: "3 years", purgePolicy: "After 5 years" },
  { recordType: "Radiology Images", retentionYears: 7, archiveAfter: "5 years", purgePolicy: "After 7 years" },
];

const STATIONERY_TEMPLATES = [
  { key: "admission_form", label: "Admission Form", owner: "Reception", required: true, fields: "UHID, IPD No, Bed, Doctor, Diagnosis" },
  { key: "consent_forms", label: "Consent Forms", owner: "Reception / Nurse", required: true, fields: "General consent, procedure consent, privacy consent" },
  { key: "nursing_chart", label: "Nursing Chart", owner: "Nurse", required: true, fields: "Vitals trend, intake/output, nursing notes" },
  { key: "doctor_order_sheet", label: "Doctor Order Sheet", owner: "Doctor", required: true, fields: "Medication, procedures, investigations" },
  { key: "discharge_summary", label: "Discharge Summary", owner: "Doctor / Billing", required: true, fields: "Course summary, medications, follow-up" },
  { key: "attachments", label: "Scanned Attachments", owner: "MRD", required: false, fields: "ID proof, insurance docs, external reports" },
];

export default function AdminMRD() {
  const {
    admissions,
    patients,
    nursingRounds,
    admissionTasks,
    inpatientCareOrders,
    doctorProgressNotes,
    labOrders,
    radiologyOrders,
    invoices,
    workflowEvents,
  } = useHospital();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("records");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [newAttachment, setNewAttachment] = useState("");
  const [manualAttachments, setManualAttachments] = useState<Record<string, string[]>>({});
  const [archivedAdmissions, setArchivedAdmissions] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedAdmissionId && admissions.length) {
      setSelectedAdmissionId(admissions[0].id);
    }
  }, [admissions, selectedAdmissionId]);

  const fileRows = useMemo(() => {
    return admissions.map((admission) => {
      const hasAdmissionForm = true;
      const hasConsent = !!patients.find((patient) => patient.uhid === admission.uhid);
      const hasNursingChart = nursingRounds.some((round) => round.admissionId === admission.id);
      const hasDoctorOrders = admissionTasks.some((task) => task.admissionId === admission.id)
        || inpatientCareOrders.some((order) => order.admissionId === admission.id);
      const hasDischargeSummary = !!admission.dischargeSummary;

      const linkedLab = labOrders.filter((order) => order.uhid === admission.uhid).length;
      const linkedRadiology = radiologyOrders.filter((order) => order.uhid === admission.uhid).length;
      const linkedBilling = invoices.filter((invoice) => invoice.uhid === admission.uhid).length;
      const linkedNotes = doctorProgressNotes.filter((note) => note.admissionId === admission.id).length;
      const attachments = manualAttachments[admission.id] || [];

      const completeness = [
        hasAdmissionForm,
        hasConsent,
        hasNursingChart,
        hasDoctorOrders,
        hasDischargeSummary,
        attachments.length > 0,
      ].filter(Boolean).length * (100 / 6);

      return {
        admissionId: admission.id,
        uhid: admission.uhid,
        patient: admission.patientName,
        department: admission.department || "General Medicine",
        ward: admission.ward,
        bed: admission.bed,
        status: archivedAdmissions.includes(admission.id) ? "Archived" : "Active",
        hasAdmissionForm,
        hasConsent,
        hasNursingChart,
        hasDoctorOrders,
        hasDischargeSummary,
        linkedLab,
        linkedRadiology,
        linkedBilling,
        linkedNotes,
        attachments,
        completeness: Math.round(completeness),
      };
    });
  }, [admissionTasks, admissions, archivedAdmissions, doctorProgressNotes, inpatientCareOrders, invoices, labOrders, manualAttachments, nursingRounds, patients, radiologyOrders]);

  const filteredRows = fileRows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return row.patient.toLowerCase().includes(query)
      || row.uhid.toLowerCase().includes(query)
      || row.admissionId.toLowerCase().includes(query)
      || row.ward.toLowerCase().includes(query)
      || row.bed.toLowerCase().includes(query);
  });

  const selectedFile = fileRows.find((row) => row.admissionId === selectedAdmissionId) || filteredRows[0];

  const averageCompleteness = fileRows.length
    ? Math.round(fileRows.reduce((sum, row) => sum + row.completeness, 0) / fileRows.length)
    : 0;

  const archiveReadyCount = fileRows.filter((row) => row.completeness >= 80).length;

  const addAttachment = () => {
    if (!selectedFile) {
      return;
    }

    const value = newAttachment.trim();
    if (!value) {
      return;
    }

    setManualAttachments((prev) => {
      const existing = prev[selectedFile.admissionId] || [];
      return {
        ...prev,
        [selectedFile.admissionId]: [...existing, value],
      };
    });

    setNewAttachment("");
    toast.success("Attachment linked to encounter");
  };

  const archiveFile = () => {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.completeness < 80) {
      toast.error("Complete required forms before archiving");
      return;
    }

    setArchivedAdmissions((prev) => (prev.includes(selectedFile.admissionId) ? prev : [selectedFile.admissionId, ...prev]));
    toast.success(`Final file archived for ${selectedFile.patient}`);
  };

  const exportRecordIndex = () => {
    downloadCsv(
      filteredRows.map((row) => ({
        admissionId: row.admissionId,
        uhid: row.uhid,
        patient: row.patient,
        department: row.department,
        ward: row.ward,
        bed: row.bed,
        status: row.status,
        completenessPct: row.completeness,
        linkedLab: row.linkedLab,
        linkedRadiology: row.linkedRadiology,
        linkedBilling: row.linkedBilling,
        linkedNotes: row.linkedNotes,
        attachments: row.attachments.join(" | "),
      })),
      `ipd-file-index-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("IPD file index exported");
  };

  const exportSelectedFile = () => {
    if (!selectedFile) {
      return;
    }

    downloadJson(
      {
        generatedAt: new Date().toISOString(),
        admissionId: selectedFile.admissionId,
        uhid: selectedFile.uhid,
        patient: selectedFile.patient,
        department: selectedFile.department,
        ward: selectedFile.ward,
        bed: selectedFile.bed,
        status: selectedFile.status,
        completeness: selectedFile.completeness,
        forms: {
          admissionForm: selectedFile.hasAdmissionForm,
          consentForms: selectedFile.hasConsent,
          nursingChart: selectedFile.hasNursingChart,
          doctorOrderSheet: selectedFile.hasDoctorOrders,
          dischargeSummary: selectedFile.hasDischargeSummary,
          scannedAttachments: selectedFile.attachments,
        },
        linkedArtifacts: {
          labOrders: selectedFile.linkedLab,
          radiologyReports: selectedFile.linkedRadiology,
          billingDocuments: selectedFile.linkedBilling,
          doctorNotes: selectedFile.linkedNotes,
        },
      },
      `ipd-file-${selectedFile.uhid}-${new Date().toISOString().slice(0, 10)}.json`,
    );

    toast.success("Patient file package exported");
  };

  const recentAccessLogs = workflowEvents
    .filter((event) => event.module === "reception" || event.module === "doctor" || event.module === "nurse" || event.module === "billing" || event.module === "lab" || event.module === "radiology")
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records Department</h1>
          <p className="text-sm text-muted-foreground">IPD file workflow, document stationery templates, scanned attachments, and digital archival</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportRecordIndex}><Download className="h-4 w-4 mr-1" /> Export Index</Button>
          <Button onClick={exportSelectedFile} disabled={!selectedFile}><Download className="h-4 w-4 mr-1" /> Export File Package</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{fileRows.length}</p><p className="text-xs text-muted-foreground">Active IPD Files</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">{archiveReadyCount}</p><p className="text-xs text-muted-foreground">Archive Ready</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Archive className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{archivedAdmissions.length}</p><p className="text-xs text-muted-foreground">Archived</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Shield className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{averageCompleteness}%</p><p className="text-xs text-muted-foreground">Completeness</p></div></CardContent></Card>
      </div>

      <div className="flex gap-1 border-b pb-1 overflow-x-auto">
        {([
          { key: "records", label: "Patient Files" },
          { key: "workflow", label: "File Workflow" },
          { key: "templates", label: "Stationery Templates" },
          { key: "retention", label: "Retention Policies" },
          { key: "audit", label: "Access Audit" },
        ] as const).map((item) => (
          <Button key={item.key} size="sm" variant={tab === item.key ? "default" : "ghost"} onClick={() => setTab(item.key)}>
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "records" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by patient, UHID, admission ID, ward, or bed" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Admission ID</th>
                    <th className="p-3 font-medium">Patient</th>
                    <th className="p-3 font-medium">UHID</th>
                    <th className="p-3 font-medium">Ward / Bed</th>
                    <th className="p-3 font-medium">Linked Docs</th>
                    <th className="p-3 font-medium">Completeness</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.admissionId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{row.admissionId}</td>
                      <td className="p-3 font-medium">{row.patient}</td>
                      <td className="p-3 font-mono text-xs">{row.uhid}</td>
                      <td className="p-3 text-sm">{row.ward} · {row.bed}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        Lab {row.linkedLab} · Radio {row.linkedRadiology} · Billing {row.linkedBilling} · Notes {row.linkedNotes}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${row.completeness}%` }} />
                          </div>
                          <span className="text-xs">{row.completeness}%</span>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant={row.status === "Active" ? "default" : "secondary"}>{row.status}</Badge></td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAdmissionId(row.admissionId);
                            setTab("workflow");
                          }}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {tab === "workflow" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[260px]">
              <p className="text-sm font-medium mb-1">Select IPD Encounter</p>
              <Select value={selectedFile?.admissionId || ""} onValueChange={setSelectedAdmissionId}>
                <SelectTrigger><SelectValue placeholder="Select admission" /></SelectTrigger>
                <SelectContent>
                  {fileRows.map((row) => (
                    <SelectItem key={row.admissionId} value={row.admissionId}>{row.admissionId} · {row.patient} ({row.ward})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={archiveFile} disabled={!selectedFile}>Archive Final File</Button>
          </div>

          {selectedFile ? (
            <>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Patient File Workflow</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">1. Admission file generated</p>
                    <p className="text-xs text-muted-foreground mt-1">UHID {selectedFile.uhid} linked with IPD No {selectedFile.admissionId}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">2. All forms linked to encounter</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant={selectedFile.hasAdmissionForm ? "default" : "outline"}>Admission form</Badge>
                      <Badge variant={selectedFile.hasConsent ? "default" : "outline"}>Consent forms</Badge>
                      <Badge variant={selectedFile.hasNursingChart ? "default" : "outline"}>Nursing chart</Badge>
                      <Badge variant={selectedFile.hasDoctorOrders ? "default" : "outline"}>Doctor order sheet</Badge>
                      <Badge variant={selectedFile.hasDischargeSummary ? "default" : "outline"}>Discharge summary</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">3. Encounter-linked documents</p>
                    <p className="text-xs text-muted-foreground mt-1">Lab orders: {selectedFile.linkedLab} · Radiology reports: {selectedFile.linkedRadiology} · Billing docs: {selectedFile.linkedBilling} · Doctor notes: {selectedFile.linkedNotes}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium">4. Final digital archive</p>
                    <p className="text-xs text-muted-foreground mt-1">Current state: {selectedFile.status} · File completeness {selectedFile.completeness}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Paperclip className="h-4 w-4" /> Scanned Attachments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newAttachment}
                      onChange={(event) => setNewAttachment(event.target.value)}
                      placeholder="Add attachment name (ID proof, insurance card, external report)"
                    />
                    <Button onClick={addAttachment}>Attach</Button>
                  </div>
                  <div className="space-y-2">
                    {(selectedFile.attachments.length === 0 ? ["No scanned attachments linked yet."] : selectedFile.attachments).map((attachment) => (
                      <div key={attachment} className="rounded-md border px-3 py-2 text-sm">{attachment}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No admission file selected.</CardContent></Card>
          )}
        </div>
      )}

      {tab === "templates" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Stationery and Document Templates</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Template</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Required</th>
                  <th className="pb-2 font-medium">Core Fields</th>
                </tr>
              </thead>
              <tbody>
                {STATIONERY_TEMPLATES.map((template) => (
                  <tr key={template.key} className="border-b last:border-0">
                    <td className="py-2 font-medium">{template.label}</td>
                    <td className="py-2">{template.owner}</td>
                    <td className="py-2"><Badge variant={template.required ? "default" : "outline"}>{template.required ? "Mandatory" : "Optional"}</Badge></td>
                    <td className="py-2 text-muted-foreground">{template.fields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "retention" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Data Retention Policies</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Record Type</th>
                  <th className="pb-2 font-medium">Retention Period</th>
                  <th className="pb-2 font-medium">Archive After</th>
                  <th className="pb-2 font-medium">Purge Policy</th>
                </tr>
              </thead>
              <tbody>
                {RETENTION_POLICIES.map((policy) => (
                  <tr key={policy.recordType} className="border-b last:border-0">
                    <td className="py-2 font-medium">{policy.recordType}</td>
                    <td className="py-2">{policy.retentionYears} years</td>
                    <td className="py-2">{policy.archiveAfter}</td>
                    <td className="py-2 text-muted-foreground">{policy.purgePolicy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "audit" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent File Access and Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentAccessLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity events recorded yet.</p>
            ) : recentAccessLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                <div>
                  <span className="font-medium">{log.module.toUpperCase()}</span>
                  <span className="text-muted-foreground"> — {log.action.replaceAll("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{log.uhid || log.refId || "System"}</Badge>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
