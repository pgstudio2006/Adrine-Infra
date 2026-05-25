import {
  listAllowedOtActions,
  listAllowedInventoryActions,
  listAllowedDialysisActions,
  type OtCaseState,
  type InventoryStockMoveState,
  type DialysisSessionState,
} from '@adrine/hospital-operations';

export type LifecycleNextAction = {
  action: string;
  label: string;
  href?: string;
  variant?: 'default' | 'outline' | 'destructive';
};

export const OT_STATE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  preop_ready: 'Pre-op ready',
  in_progress: 'In surgery',
  postop_recovery: 'Recovery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const INVENTORY_MOVE_STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  issued: 'Issued',
  in_transit: 'In transit',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const DIALYSIS_STATE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  in_progress: 'In progress',
  monitoring: 'Monitoring',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

const OT_ACTION_META: Record<string, Omit<LifecycleNextAction, 'action'>> = {
  confirm_case: { label: 'Confirm case', href: '/ot/preop' },
  complete_preop: { label: 'Complete pre-op', href: '/ot/preop' },
  start_surgery: { label: 'Start surgery', href: '/ot/intraop' },
  end_surgery: { label: 'End surgery', href: '/ot/postop' },
  complete_case: { label: 'Complete case', href: '/ot/postop' },
  cancel_case: { label: 'Cancel case', variant: 'destructive' },
};

const INVENTORY_ACTION_META: Record<string, Omit<LifecycleNextAction, 'action'>> = {
  submit_move: { label: 'Submit move', href: '/inventory/issue' },
  approve_move: { label: 'Approve move', href: '/inventory/requisitions' },
  issue_stock: { label: 'Issue stock', href: '/inventory/issue' },
  dispatch_transfer: { label: 'Dispatch transfer', href: '/inventory/distribution' },
  receive_stock: { label: 'Receive (GRN)', href: '/inventory/grn' },
  cancel_move: { label: 'Cancel move', variant: 'destructive' },
};

const DIALYSIS_ACTION_META: Record<string, Omit<LifecycleNextAction, 'action'>> = {
  check_in_patient: { label: 'Check in', href: '/dialysis/session' },
  start_session: { label: 'Start session', href: '/dialysis/session' },
  begin_monitoring: { label: 'Open monitoring', href: '/dialysis/session' },
  complete_session: { label: 'Complete session', href: '/dialysis/session' },
  mark_no_show: { label: 'Mark no-show', variant: 'outline' },
  cancel_session: { label: 'Cancel session', variant: 'destructive' },
};

function pickPrimaryAction(
  allowed: string[],
  meta: Record<string, Omit<LifecycleNextAction, 'action'>>,
): LifecycleNextAction | null {
  const priority = Object.keys(meta);
  const action = priority.find((a) => allowed.includes(a)) ?? allowed[0];
  if (!action) return null;
  return { action, ...meta[action], label: meta[action]?.label ?? action.replace(/_/g, ' ') };
}

export function getOtNextAction(state: string, role: string): LifecycleNextAction | null {
  const allowed = listAllowedOtActions(state as OtCaseState, role);
  return pickPrimaryAction(allowed, OT_ACTION_META);
}

export function getInventoryMoveNextAction(
  state: string,
  role: string,
): LifecycleNextAction | null {
  const allowed = listAllowedInventoryActions(state as InventoryStockMoveState, role);
  return pickPrimaryAction(allowed, INVENTORY_ACTION_META);
}

export function getDialysisNextAction(state: string, role: string): LifecycleNextAction | null {
  const allowed = listAllowedDialysisActions(state as DialysisSessionState, role);
  return pickPrimaryAction(allowed, DIALYSIS_ACTION_META);
}

export function isScheduledToday(iso?: string | null): boolean {
  if (!iso) return true;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function otStateBadgeClass(state: string): string {
  if (state === 'in_progress') return 'bg-warning/10 text-warning border-warning/20';
  if (state === 'completed') return 'bg-success/10 text-success border-success/20';
  if (state === 'cancelled') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (state === 'preop_ready' || state === 'confirmed') return 'bg-info/10 text-info border-info/20';
  return 'bg-muted text-muted-foreground';
}

export function inventoryStateBadgeClass(state: string): string {
  if (state === 'received') return 'bg-success/10 text-success border-success/20';
  if (state === 'issued' || state === 'in_transit') return 'bg-warning/10 text-warning border-warning/20';
  if (state === 'cancelled') return 'bg-destructive/10 text-destructive border-destructive/20';
  return 'bg-muted text-muted-foreground';
}

export function dialysisStateBadgeClass(state: string): string {
  if (state === 'in_progress' || state === 'monitoring') return 'bg-warning/10 text-warning border-warning/20';
  if (state === 'completed') return 'bg-success/10 text-success border-success/20';
  if (state === 'cancelled' || state === 'no_show') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (state === 'checked_in') return 'bg-info/10 text-info border-info/20';
  return 'bg-muted text-muted-foreground';
}
