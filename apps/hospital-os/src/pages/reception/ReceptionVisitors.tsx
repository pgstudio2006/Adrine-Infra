import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, CalendarCheck, BadgeCheck, UserCheck, Plus } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";

interface VisitorPass {
  id: string;
  patientUhid: string;
  patientName: string;
  visitorName: string;
  relation: string;
  purpose: string;
  passNo: string;
  validFrom: string;
  validUntil: string;
  status: "active" | "expired";
}

const SEED_VISITORS: VisitorPass[] = [
  {
    id: "vp-001",
    patientUhid: "UHID-240003",
    patientName: "Amit Kumar",
    visitorName: "Ravi Kumar",
    relation: "Spouse",
    purpose: "Care attendant",
    passNo: "VP-00001",
    validFrom: "08:00",
    validUntil: "20:00",
    status: "active",
  },
  {
    id: "vp-002",
    patientUhid: "UHID-240008",
    patientName: "Fatima Khan",
    visitorName: "Salim Khan",
    relation: "Spouse",
    purpose: "Overnight attendant",
    passNo: "VP-00002",
    validFrom: "18:00",
    validUntil: "08:00+1",
    status: "active",
  },
  {
    id: "vp-003",
    patientUhid: "UHID-240007",
    patientName: "Arjun Reddy",
    visitorName: "Priya Reddy",
    relation: "Spouse",
    purpose: "Day visitor",
    passNo: "VP-00003",
    validFrom: "10:00",
    validUntil: "14:00",
    status: "expired",
  },
  {
    id: "vp-004",
    patientUhid: "UHID-240003",
    patientName: "Amit Kumar",
    visitorName: "Kavya Kumar",
    relation: "Child",
    purpose: "Day visitor",
    passNo: "VP-00004",
    validFrom: "14:00",
    validUntil: "18:00",
    status: "active",
  },
];

const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const defaultFrom = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
const later = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const defaultUntil = `${later.getFullYear()}-${pad(later.getMonth() + 1)}-${pad(later.getDate())}T${pad(later.getHours())}:${pad(later.getMinutes())}`;

export default function ReceptionVisitors() {
  const { admissions, patients } = useHospital();

  const [visitors, setVisitors] = useState<VisitorPass[]>(SEED_VISITORS);

  const [form, setForm] = useState({
    patientUhid: "",
    visitorName: "",
    relation: "",
    purpose: "",
    validFrom: defaultFrom,
    validUntil: defaultUntil,
  });

  const activeAdmissions = admissions.filter((a) => a.status !== "discharged");

  const activeToday = visitors.filter((v) => v.status === "active").length;
  const expiredToday = visitors.filter((v) => v.status === "expired").length;
  const totalToday = visitors.length;

  function handleIssuePass() {
    if (!form.patientUhid || !form.visitorName.trim() || !form.relation || !form.purpose) {
      toast.error("Please fill all required fields");
      return;
    }

    const admission = activeAdmissions.find((a) => a.uhid === form.patientUhid);
    const patient = patients.find((p) => p.uhid === form.patientUhid);
    const patientName = admission?.patientName ?? patient?.name ?? form.patientUhid;

    const newPass: VisitorPass = {
      id: `vp-${Date.now()}`,
      patientUhid: form.patientUhid,
      patientName,
      visitorName: form.visitorName.trim(),
      relation: form.relation,
      purpose: form.purpose,
      passNo: `VP-${Date.now().toString().slice(-5)}`,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      status: "active",
    };

    setVisitors((prev) => [newPass, ...prev]);
    setForm((prev) => ({ ...prev, visitorName: "", relation: "", purpose: "" }));
    toast.success("Visitor pass issued");
  }

  const patientOptions = activeAdmissions.map((a) => ({
    value: a.uhid,
    label: `${a.patientName} (${a.uhid})`,
  }));

  return (
    <motion.div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visitor &amp; Attendant Passes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register and manage visitor passes for admitted patients
        </p>
      </div>

      {/* Preview strip */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-warning">
        Preview — visitor pass records are stored locally. Production would sync to kernel-api for
        security gate integrations.
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeToday}</p>
              <p className="text-xs text-muted-foreground">Active passes today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredToday}</p>
              <p className="text-xs text-muted-foreground">Passes expiring in 1h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalToday}</p>
              <p className="text-xs text-muted-foreground">Total registered today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* LEFT: Active Visitors */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Active Visitors</CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">
                {visitors.length} passes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Patient
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Visitor
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                      Purpose
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                      Pass #
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                      Valid until
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visitors.map((v) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{v.patientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{v.patientUhid}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{v.visitorName}</p>
                        <p className="text-xs text-muted-foreground">{v.relation}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {v.purpose}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs hidden sm:table-cell">
                        {v.passNo}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {v.validFrom} – {v.validUntil}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={v.status === "active" ? "default" : "secondary"}
                          className={`text-xs capitalize ${
                            v.status === "active"
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {v.status === "active" ? (
                            <BadgeCheck className="w-3 h-3 mr-1 inline-block" />
                          ) : null}
                          {v.status}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                  {visitors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No visitor passes issued yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Register New Visitor Pass */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Register New Visitor Pass</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Patient (admitted)</Label>
              <AppSelect
                value={form.patientUhid}
                onValueChange={(v) => setForm((prev) => ({ ...prev, patientUhid: v }))}
                placeholder="Select admitted patient"
                options={patientOptions}
                className="w-full h-9 px-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Visitor Name</Label>
              <Input
                value={form.visitorName}
                onChange={(e) => setForm((prev) => ({ ...prev, visitorName: e.target.value }))}
                placeholder="e.g. Ravi Kumar"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Relation to Patient</Label>
              <AppSelect
                value={form.relation}
                onValueChange={(v) => setForm((prev) => ({ ...prev, relation: v }))}
                placeholder="Select relation"
                options={[
                  { value: "Spouse", label: "Spouse" },
                  { value: "Parent", label: "Parent" },
                  { value: "Child", label: "Child" },
                  { value: "Sibling", label: "Sibling" },
                  { value: "Friend", label: "Friend" },
                  { value: "Other", label: "Other" },
                ]}
                className="w-full h-9 px-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Visit Purpose</Label>
              <AppSelect
                value={form.purpose}
                onValueChange={(v) => setForm((prev) => ({ ...prev, purpose: v }))}
                placeholder="Select purpose"
                options={[
                  { value: "Care attendant", label: "Care attendant" },
                  { value: "Day visitor", label: "Day visitor" },
                  { value: "Overnight attendant", label: "Overnight attendant" },
                ]}
                className="w-full h-9 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valid From</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valid Until</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>

            <Button onClick={handleIssuePass} className="w-full gap-2" size="lg">
              <BadgeCheck className="w-4 h-4" />
              Issue Pass
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
