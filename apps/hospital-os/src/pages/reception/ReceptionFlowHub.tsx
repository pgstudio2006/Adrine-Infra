import {
  frontDeskSpine,
  opdVisitLifecycle,
  canTransition,
} from "@adrine/hospital-operations";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/stores/hospitalStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { PatientContextBar } from "@/components/shared/PatientContextBar";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";
import { usePlatformHydration } from "@/hooks/usePlatformHydration";
import { OperationalFinancialPanel } from "@/components/operations/OperationalFinancialPanel";
import { OperationalLabPanel } from "@/components/operations/OperationalLabPanel";
import { OperationalPharmacyPanel } from "@/components/operations/OperationalPharmacyPanel";
import { OperationalIpdPanel } from "@/components/operations/OperationalIpdPanel";
import { OperationalDischargePanel } from "@/components/operations/OperationalDischargePanel";
import { OperationalCommandCenterPanel } from "@/components/operations/OperationalCommandCenterPanel";
import { OperationalRadiologyPanel } from "@/components/operations/OperationalRadiologyPanel";
import { OperationalFinancialCommandPanel } from "@/components/operations/OperationalFinancialCommandPanel";
import { OperationalPanelsHubProvider } from "@/hooks/useOperationalPanelsSync";

/**
 * Operational command center for front desk — enforces correct OPD sequence.
 */
export default function ReceptionFlowHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, appointments, queue, invoices, admissions } = useHospital();
  const { error: hydrationError, retry } = usePlatformHydration({});

  const role = user?.role ?? "receptionist";

  const liveFinancialPatient = patients.find(
    (p) =>
      p.platformOpdVisitId &&
      p.patientType === "OPD" &&
      p.opdState !== "completed",
  );

  const liveIpdAdmission = admissions.find(
    (a) => a.platformAdmissionId && a.status !== "discharged",
  );

  const stepHints: Record<string, { done: boolean; hint: string }> = {
    register: {
      done: patients.length > 0,
      hint: `${patients.length} patients in today's context`,
    },
    schedule: {
      done: appointments.some((a) => a.status !== "cancelled"),
      hint: `${appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length} active appointments`,
    },
    checkin: {
      done: appointments.some(
        (a) => a.status === "checked-in" || a.status === "in-consultation",
      ),
      hint: "Check-in moves visit to clinical queue",
    },
    routing: {
      done: patients.some(
        (p) => p.opdState === "routed" || p.opdState === "queued",
      ),
      hint: "Assign department and consulting physician",
    },
    queue: {
      done: queue.length > 0,
      hint: `${queue.filter((q) => q.status === "waiting").length} waiting in queue`,
    },
    billing_exit: {
      done: invoices.some((i) => i.status === "paid" || i.status === "partial"),
      hint: "Settle OPD bill before patient leaves",
    },
  };

  return (
    <OperationalPanelsHubProvider>
      <motion.div className="space-y-6 operational-panels-stack">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Front desk flow</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Follow this sequence for every OPD / walk-in visit. Steps map to
            platform lifecycles and events.
          </p>
        </motion.div>

        <InlinePlatformError error={hydrationError} onRetry={retry} />

        {liveFinancialPatient && (
          <PatientContextBar
            uhid={liveFinancialPatient.uhid}
            name={liveFinancialPatient.name}
            visitState={liveFinancialPatient.opdState}
            patientType={liveFinancialPatient.patientType}
            platformPatientId={liveFinancialPatient.platformPatientId}
            platformOpdVisitId={liveFinancialPatient.platformOpdVisitId}
            department={liveFinancialPatient.department}
          />
        )}

        <OperationalCommandCenterPanel />

        <OperationalFinancialCommandPanel />

        <OperationalFinancialPanel
          opdVisitId={liveFinancialPatient?.platformOpdVisitId}
          patientName={liveFinancialPatient?.name}
        />

        <OperationalLabPanel
          opdVisitId={liveFinancialPatient?.platformOpdVisitId}
          patientName={liveFinancialPatient?.name}
        />

        <OperationalRadiologyPanel
          opdVisitId={liveFinancialPatient?.platformOpdVisitId}
          patientName={liveFinancialPatient?.name}
        />

        <OperationalPharmacyPanel
          opdVisitId={liveFinancialPatient?.platformOpdVisitId}
          patientName={liveFinancialPatient?.name}
        />

        <OperationalIpdPanel
          admissionId={liveIpdAdmission?.platformAdmissionId}
          patientName={liveIpdAdmission?.patientName}
        />

        <OperationalDischargePanel
          admissionId={liveIpdAdmission?.platformAdmissionId}
          patientName={liveIpdAdmission?.patientName}
          insuranceClearanceContext={
            liveIpdAdmission?.status === "discharge-ready"
              ? { insuranceSettledOrSelfPay: true, noDischargeBlockers: true }
              : undefined
          }
          completeDischargeContext={
            liveIpdAdmission?.status === "discharge-ready"
              ? { finalBillSettled: true, bedReleaseScheduled: true }
              : undefined
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              OPD lifecycle (reference)
            </CardTitle>
            <CardDescription>
              States: {opdVisitLifecycle.states.join(" → ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Next valid actions depend on current state and your role. Billing
            before check-in is blocked in production configuration.
          </CardContent>
        </Card>

        <motion.div
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {frontDeskSpine.steps.map((step, index) => {
            const tab = step.route;
            const meta = stepHints[step.id] ?? { done: false, hint: "" };
            const gate =
              step.lifecycleId === "opd_visit" && step.targetState === "queued"
                ? canTransition(
                    opdVisitLifecycle,
                    "checked_in",
                    "issue_token",
                    role,
                  )
                : { ok: true as const };

            return (
              <Card
                key={step.id}
                className={meta.done ? "border-primary/30" : ""}
              >
                <CardHeader className="pb-2">
                  <motion.div className="flex items-start justify-between gap-2">
                    <motion.div className="flex items-center gap-2">
                      {meta.done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <CardTitle className="text-base">
                        {index + 1}. {step.label}
                      </CardTitle>
                    </motion.div>
                    {!gate.ok && (
                      <Badge variant="outline" className="text-[10px]">
                        Blocked
                      </Badge>
                    )}
                  </motion.div>
                  <CardDescription>{meta.hint}</CardDescription>
                </CardHeader>
                <CardContent>
                  {step.dependsOn?.length ? (
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Requires: {step.dependsOn.join(", ")}
                    </p>
                  ) : null}
                  {tab ? (
                    <Button
                      size="sm"
                      variant={meta.done ? "outline" : "default"}
                      className="w-full"
                      onClick={() => navigate(tab)}
                      disabled={!gate.ok}
                    >
                      Open screen
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </motion.div>
    </OperationalPanelsHubProvider>
  );
}
