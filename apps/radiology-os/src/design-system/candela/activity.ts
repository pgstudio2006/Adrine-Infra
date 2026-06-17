/* ═══════════════════════════════════════════
   Candela Design System v2 — Activity
   Global event feed types and event definitions
   ═══════════════════════════════════════════ */

export type ActivityEventType =
  | 'patient.created'
  | 'patient.updated'
  | 'order.created'
  | 'order.scheduled'
  | 'scan.started'
  | 'scan.completed'
  | 'report.started'
  | 'report.saved'
  | 'report.finalized'
  | 'report.dispatched'
  | 'study.cancelled'
  | 'invoice.created'
  | 'payment.recorded'
  | 'appointment.booked'
  | 'template.created'
  | 'ai.insight.generated'
  | 'study.critical';

export interface CandelaActivityEvent {
  id: string;
  type: ActivityEventType;
  actor: string;
  actorRole: string;
  timestamp: Date;
  department: string;
  module: string;
  summary: string;
  /** Reference link for navigation */
  ref?: { path: string; label: string };
  /** Severity for visual distinction */
  severity?: 'info' | 'success' | 'warning' | 'critical';
  patientId?: string;
  patientName?: string;
  studyId?: string;
  metadata?: Record<string, any>;
}

export type ActivityListener = (event: CandelaActivityEvent) => void;

/* ─── Patient drawer sections ─── */
export interface PatientDrawerSection {
  id: string;
  label: string;
  icon: string;
  /** Route to fetch data from */
  route?: string;
  /** Order in the drawer tabs */
  order: number;
}

export const PATIENT_DRAWER_SECTIONS: PatientDrawerSection[] = [
  { id: 'timeline', label: 'Timeline', icon: 'Clock', order: 0 },
  { id: 'appointments', label: 'Appointments', icon: 'Calendar', order: 1 },
  { id: 'billing', label: 'Billing', icon: 'IndianRupee', order: 2 },
  { id: 'labs', label: 'Labs', icon: 'FlaskConical', order: 3 },
  { id: 'radiology', label: 'Radiology', icon: 'ScanLine', order: 4 },
  { id: 'prescriptions', label: 'Prescriptions', icon: 'Pill', order: 5 },
  { id: 'crm', label: 'CRM', icon: 'MessageSquare', order: 6 },
  { id: 'documents', label: 'Documents', icon: 'FileText', order: 7 },
  { id: 'notes', label: 'Notes', icon: 'StickyNote', order: 8 },
];

/* ─── Simple global event bus ─── */
class ActivityEventBus {
  private listeners = new Map<ActivityEventType | '*', ActivityListener[]>();

  on(type: ActivityEventType | '*', listener: ActivityListener): () => void {
    const list = this.listeners.get(type) || [];
    list.push(listener);
    this.listeners.set(type, list);
    return () => {
      const updated = list.filter(l => l !== listener);
      if (updated.length === 0) this.listeners.delete(type);
      else this.listeners.set(type, updated);
    };
  }

  emit(event: CandelaActivityEvent): void {
    // Notify specific type listeners
    const typeListeners = this.listeners.get(event.type) || [];
    typeListeners.forEach(l => l(event));
    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*') || [];
    wildcardListeners.forEach(l => l(event));
  }
}

export const activityBus = new ActivityEventBus();
