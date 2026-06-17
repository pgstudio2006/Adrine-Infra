'use client';

import { useActivity } from '@/components/candela-app/hooks/useActivity';
import type { CandelaActivityEvent } from '@/design-system/candela';
import * as Icons from 'lucide-react';

const TYPE_ICONS: Record<string, React.FC<{ size?: number }>> = {
  'patient.created': Icons.UserPlus,
  'order.created': Icons.FilePlus,
  'scan.started': Icons.Play,
  'scan.completed': Icons.CheckCircle,
  'report.finalized': Icons.FileCheck,
  'report.dispatched': Icons.Send,
  'payment.recorded': Icons.IndianRupee,
  'appointment.booked': Icons.Calendar,
  'study.critical': Icons.AlertTriangle,
};

function getIcon(type: string) {
  return TYPE_ICONS[type] || Icons.Circle;
}

function getSeverityColor(event: CandelaActivityEvent): string {
  if (event.severity === 'critical') return 'var(--c-critical)';
  if (event.severity === 'warning') return 'var(--c-warning)';
  if (event.severity === 'success') return 'var(--c-success)';
  return 'var(--c-info)';
}

interface ActivityFeedProps {
  maxItems?: number;
  compact?: boolean;
}

export function ActivityFeed({ maxItems = 20, compact = false }: ActivityFeedProps) {
  const { events } = useActivity(maxItems);

  // Demo events if empty
  const displayEvents = events.length > 0 ? events : DEMO_EVENTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {displayEvents.slice(0, maxItems).map((event, i) => {
        const Icon = getIcon(event.type);
        const color = getSeverityColor(event);
        return (
          <div
            key={event.id || i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: compact ? '6px 8px' : '10px 12px',
              borderRadius: 'var(--c-radius-md)',
              transition: 'background var(--c-transition-fast)',
              cursor: event.ref ? 'pointer' : 'default',
            }}
            className="c-surface-hoverable"
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--c-radius-md)',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: compact ? 11 : 12,
                fontWeight: 500,
                color: 'var(--c-text)',
                margin: 0,
              }}>
                {event.summary}
              </p>
              <p style={{
                fontSize: compact ? 9 : 10,
                color: 'var(--c-text-tertiary)',
                marginTop: 1,
              }}>
                {event.actor} · {formatTime(event.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ─── Demo events ─── */
const DEMO_EVENTS: CandelaActivityEvent[] = [
  { id: 'd1', type: 'order.created', actor: 'Receptionist', actorRole: 'receptionist', timestamp: new Date(Date.now() - 2 * 60000), department: 'Radiology', module: 'RIS', summary: 'MRI Brain ordered for Priya Sharma', severity: 'info', ref: { path: '/worklist', label: 'View' } },
  { id: 'd2', type: 'scan.completed', actor: 'Tech. Suresh', actorRole: 'technician', timestamp: new Date(Date.now() - 8 * 60000), department: 'Radiology', module: 'RIS', summary: 'CT Chest completed for Rajesh Kumar', severity: 'success' },
  { id: 'd3', type: 'report.finalized', actor: 'Dr. Iyer', actorRole: 'radiologist', timestamp: new Date(Date.now() - 15 * 60000), department: 'Radiology', module: 'RIS', summary: 'X-Ray Knee report finalized for Anita Desai', severity: 'success' },
  { id: 'd4', type: 'study.critical', actor: 'Dr. Iyer', actorRole: 'radiologist', timestamp: new Date(Date.now() - 35 * 60000), department: 'Radiology', module: 'RIS', summary: 'Critical finding flagged — CT Abdomen for Meena Devi', severity: 'critical' },
  { id: 'd5', type: 'report.dispatched', actor: 'Receptionist', actorRole: 'receptionist', timestamp: new Date(Date.now() - 22 * 60000), department: 'Radiology', module: 'RIS', summary: 'USG Abdomen report dispatched to Suresh Patel', severity: 'info' },
];
