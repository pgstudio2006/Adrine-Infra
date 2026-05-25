import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Activity,
  FileText,
  Pill,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHospital } from '@/stores/hospitalStore';
import { useDoctorScope } from '@/hooks/useDoctorScope';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

type TimelineItemType = 'visit' | 'admission' | 'lab' | 'radiology' | 'billing' | 'workflow';

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  description: string;
  timestamp: string;
  sortValue: number;
}

const timelineTypeStyle: Record<TimelineItemType, string> = {
  visit: 'bg-blue-500/10 text-blue-700',
  admission: 'bg-amber-500/10 text-amber-700',
  lab: 'bg-emerald-500/10 text-emerald-700',
  radiology: 'bg-violet-500/10 text-violet-700',
  billing: 'bg-foreground/10 text-foreground',
  workflow: 'bg-muted text-muted-foreground',
};

const tabs = ['Timeline', 'Clinical', 'Orders', 'Financial'];

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export default function DoctorPatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { appointments, admissions, labOrders, radiologyOrders, prescriptions, invoices, getPatientWorkflowTimeline } = useHospital();
  const { isDoctor, canAccessPatient, getPatient } = useDoctorScope();

  const [activeTab, setActiveTab] = useState('Timeline');

  if (!isDoctor || !patientId || !canAccessPatient(patientId)) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Patient Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          You can only view profiles for patients assigned to your doctor account and department.
        </p>
        <Button size="sm" onClick={() => navigate('/doctor/patients')}>Back To My Patients</Button>
      </div>
    );
  }

  const patient = getPatient(patientId);
  if (!patient) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Patient Not Found</h1>
        <p className="text-sm text-muted-foreground">Patient data is not available in the scoped dataset.</p>
        <Button size="sm" onClick={() => navigate('/doctor/patients')}>Back To My Patients</Button>
      </div>
    );
  }

  const patientAppointments = appointments.filter((appointment) => appointment.uhid === patient.uhid);
  const patientAdmissions = admissions.filter((admission) => admission.uhid === patient.uhid);
  const patientLabOrders = labOrders.filter((order) => order.uhid === patient.uhid);
  const patientRadiologyOrders = radiologyOrders.filter((order) => order.uhid === patient.uhid);
  const patientPrescriptions = prescriptions.filter((prescription) => prescription.uhid === patient.uhid);
  const patientInvoices = invoices.filter((invoice) => invoice.uhid === patient.uhid);
  const workflowTimeline = getPatientWorkflowTimeline(patient.uhid);

  const timeline: TimelineItem[] = (() => {
    const items: TimelineItem[] = [];

    patientAppointments.forEach((appointment) => {
      const timestamp = `${appointment.date} ${appointment.time}`;
      items.push({
        id: appointment.id,
        type: 'visit',
        title: `OPD ${appointment.type} visit`,
        description: `${appointment.department} · ${appointment.status}`,
        timestamp,
        sortValue: parseDate(`${appointment.date}T00:00:00`) || 0,
      });
    });

    patientAdmissions.forEach((admission) => {
      items.push({
        id: admission.id,
        type: 'admission',
        title: `${admission.journeyType} admission`,
        description: `${admission.ward} · ${admission.bed} · ${admission.status}`,
        timestamp: admission.admittedAt,
        sortValue: parseDate(admission.admittedAt),
      });
    });

    patientLabOrders.forEach((order) => {
      items.push({
        id: order.orderId,
        type: 'lab',
        title: `Lab order: ${order.tests}`,
        description: `${order.stage} · ${order.priority}`,
        timestamp: order.orderTime,
        sortValue: parseDate(order.orderTime),
      });
    });

    patientRadiologyOrders.forEach((order) => {
      items.push({
        id: order.orderId,
        type: 'radiology',
        title: `Imaging: ${order.study}`,
        description: `${order.status} · ${order.priority}`,
        timestamp: order.orderTime,
        sortValue: parseDate(order.orderTime),
      });
    });

    patientInvoices.forEach((invoice) => {
      items.push({
        id: invoice.id,
        type: 'billing',
        title: `${invoice.category} invoice ${invoice.id}`,
        description: `Total INR ${invoice.total.toLocaleString('en-IN')} · Paid INR ${invoice.paid.toLocaleString('en-IN')}`,
        timestamp: invoice.date,
        sortValue: parseDate(invoice.date),
      });
    });

    workflowTimeline.forEach((event) => {
      items.push({
        id: event.id,
        type: 'workflow',
        title: `${event.module.toUpperCase()} · ${event.action}`,
        description: event.details,
        timestamp: event.timestamp,
        sortValue: parseDate(event.timestamp),
      });
    });

    return items.sort((a, b) => b.sortValue - a.sortValue);
  })();

  const allergyTags = patient.allergies
    ? patient.allergies
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const chronicConditions = patient.chronicDiseases
    ? patient.chronicDiseases
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const totalOutstanding = patientInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.total - invoice.paid), 0);

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/doctor/patients')} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.uhid} · {patient.age}y/{patient.gender} · {patient.department || 'General Medicine'}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate(`/doctor/consultation/${patient.uhid}`)}>
          Start Consultation
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Visits</p>
          <p className="text-2xl font-bold">{patientAppointments.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Admissions</p>
          <p className="text-2xl font-bold">{patientAdmissions.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Investigations</p>
          <p className="text-2xl font-bold">{patientLabOrders.length + patientRadiologyOrders.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">INR {totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </motion.div>

      {(allergyTags.length > 0 || chronicConditions.length > 0) && (
        <motion.div {...fadeIn(2)} className="border rounded-xl p-4 bg-card space-y-3">
          {allergyTags.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5" /> Allergy Alerts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergyTags.map((allergy) => (
                  <span key={allergy} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {chronicConditions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Chronic Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {chronicConditions.map((condition) => (
                  <span key={condition} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div {...fadeIn(3)} className="border rounded-xl bg-card overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="patientTab" className="absolute inset-x-2 -bottom-px h-0.5 bg-foreground rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === 'Timeline' && (
            <div className="space-y-3">
              {timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${timelineTypeStyle[item.type]}`}>
                        {item.type}
                      </span>
                      <p className="text-sm font-semibold">{item.title}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">No timeline events found.</div>
              )}
            </div>
          )}

          {activeTab === 'Clinical' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Demographics</p>
                <p><span className="text-muted-foreground">Phone:</span> {patient.phone}</p>
                <p><span className="text-muted-foreground">Blood Group:</span> {patient.bloodGroup || 'Not recorded'}</p>
                <p><span className="text-muted-foreground">ABHA:</span> {patient.abhaId || 'Not linked'}</p>
                <p><span className="text-muted-foreground">Branch:</span> {patient.branch}</p>
              </div>

              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medication Summary</p>
                {patientPrescriptions.length === 0 && <p className="text-muted-foreground">No prescriptions recorded yet.</p>}
                {patientPrescriptions.slice(0, 4).map((prescription) => (
                  <div key={prescription.id} className="border rounded-md p-2">
                    <p className="font-medium">{prescription.id} · {prescription.status}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {prescription.meds.map((med) => med.drug).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4" /> Lab Orders</p>
                <div className="space-y-2">
                  {patientLabOrders.map((order) => (
                    <div key={order.orderId} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{order.tests}</p>
                      <p className="text-xs text-muted-foreground">{order.orderId} · {order.stage} · {order.priority}</p>
                    </div>
                  ))}
                  {patientLabOrders.length === 0 && <p className="text-sm text-muted-foreground">No lab orders.</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Radiology Orders</p>
                <div className="space-y-2">
                  {patientRadiologyOrders.map((order) => (
                    <div key={order.orderId} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{order.study}</p>
                      <p className="text-xs text-muted-foreground">{order.orderId} · {order.status} · {order.priority}</p>
                    </div>
                  ))}
                  {patientRadiologyOrders.length === 0 && <p className="text-sm text-muted-foreground">No radiology orders.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Financial' && (
            <div className="space-y-3">
              {patientInvoices.map((invoice) => {
                const balance = Math.max(0, invoice.total - invoice.paid);
                return (
                  <div key={invoice.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" /> {invoice.id}
                      </p>
                      <span className="text-xs text-muted-foreground">{invoice.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{invoice.category} · {invoice.status}</p>
                    <div className="mt-2 text-sm">
                      <p>Total: INR {invoice.total.toLocaleString('en-IN')}</p>
                      <p>Paid: INR {invoice.paid.toLocaleString('en-IN')}</p>
                      <p className="font-medium">Balance: INR {balance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
              {patientInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No billing records available.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div {...fadeIn(4)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border rounded-xl p-4 bg-card text-sm">
          <p className="text-xs text-muted-foreground mb-1">Last Visit</p>
          <p className="font-semibold">{patient.lastVisit || patient.registeredOn}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card text-sm">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Active Prescriptions</p>
          <p className="font-semibold">{patientPrescriptions.length}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card text-sm">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Admissions</p>
          <p className="font-semibold">{patientAdmissions.length}</p>
        </div>
      </motion.div>

      <motion.div {...fadeIn(5)} className="border rounded-xl p-4 bg-card text-xs text-muted-foreground flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        Timeline reflects OPD/IPD, diagnostics, pharmacy, and billing events from shared hospital workflows.
      </motion.div>
    </div>
  );
}
