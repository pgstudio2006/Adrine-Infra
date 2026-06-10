import {
  PATHOLOGY_MACHINES,
  buildDemoHl7,
  demoResultsForMachine,
  formatResultsText,
  type InboundMachineMessage,
  type PathologyMachine,
} from './pathology-machines';

const STORAGE_KEY = 'adrine_lis_middleware_demo';

export type MachineConnectionState = {
  machineId: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectedAt?: string;
  lastHeartbeat?: string;
  messagesReceived: number;
};

type MiddlewareSnapshot = {
  connections: MachineConnectionState[];
  inbox: InboundMachineMessage[];
};

function defaultConnections(): MachineConnectionState[] {
  return PATHOLOGY_MACHINES.map((machine) => ({
    machineId: machine.id,
    status: 'disconnected',
    messagesReceived: 0,
  }));
}

function readSnapshot(): MiddlewareSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { connections: defaultConnections(), inbox: [] };
    const parsed = JSON.parse(raw) as MiddlewareSnapshot;
    const knownIds = new Set(PATHOLOGY_MACHINES.map((m) => m.id));
    const connections = defaultConnections().map((base) => {
      const saved = parsed.connections?.find((c) => c.machineId === base.machineId);
      return saved && knownIds.has(saved.machineId) ? saved : base;
    });
    return { connections, inbox: Array.isArray(parsed.inbox) ? parsed.inbox : [] };
  } catch {
    return { connections: defaultConnections(), inbox: [] };
  }
}

function writeSnapshot(snapshot: MiddlewareSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function getMiddlewareSnapshot(): MiddlewareSnapshot {
  return readSnapshot();
}

export function getMachineById(machineId: string): PathologyMachine | undefined {
  return PATHOLOGY_MACHINES.find((m) => m.id === machineId);
}

export async function connectMachine(machineId: string): Promise<MachineConnectionState> {
  const snapshot = readSnapshot();
  const idx = snapshot.connections.findIndex((c) => c.machineId === machineId);
  if (idx < 0) throw new Error('Unknown machine');

  snapshot.connections[idx] = { ...snapshot.connections[idx], status: 'connecting' };
  writeSnapshot(snapshot);

  await delay(600 + Math.random() * 400);

  const now = new Date().toISOString();
  snapshot.connections[idx] = {
    ...snapshot.connections[idx],
    status: 'connected',
    connectedAt: now,
    lastHeartbeat: now,
  };
  writeSnapshot(snapshot);
  return snapshot.connections[idx];
}

export async function connectAllMachines(): Promise<void> {
  for (const machine of PATHOLOGY_MACHINES) {
    await connectMachine(machine.id);
  }
}

export function disconnectMachine(machineId: string): void {
  const snapshot = readSnapshot();
  snapshot.connections = snapshot.connections.map((c) =>
    c.machineId === machineId
      ? { machineId, status: 'disconnected', messagesReceived: c.messagesReceived }
      : c,
  );
  writeSnapshot(snapshot);
}

export function disconnectAllMachines(): void {
  writeSnapshot({ connections: defaultConnections(), inbox: readSnapshot().inbox });
}

export function simulateInboundResult(params: {
  machineId: string;
  sampleBarcode: string;
  patientName: string;
  uhid: string;
}): InboundMachineMessage {
  const machine = getMachineById(params.machineId);
  if (!machine) throw new Error('Unknown machine');

  const snapshot = readSnapshot();
  const connection = snapshot.connections.find((c) => c.machineId === params.machineId);
  if (!connection || connection.status !== 'connected') {
    throw new Error('Machine is not connected');
  }

  const parsedLines = demoResultsForMachine(params.machineId);
  const message: InboundMachineMessage = {
    id: `HL7-${Date.now()}`,
    machineId: params.machineId,
    receivedAt: new Date().toISOString(),
    sampleBarcode: params.sampleBarcode,
    patientName: params.patientName,
    uhid: params.uhid,
    rawHl7: buildDemoHl7(machine, params.sampleBarcode, params.patientName),
    parsedLines,
    status: 'pending',
  };

  snapshot.inbox = [message, ...snapshot.inbox].slice(0, 50);
  snapshot.connections = snapshot.connections.map((c) =>
    c.machineId === params.machineId
      ? {
          ...c,
          messagesReceived: c.messagesReceived + 1,
          lastHeartbeat: new Date().toISOString(),
        }
      : c,
  );
  writeSnapshot(snapshot);
  return message;
}

export function markMessageMatched(messageId: string): void {
  const snapshot = readSnapshot();
  snapshot.inbox = snapshot.inbox.map((m) =>
    m.id === messageId ? { ...m, status: 'matched' } : m,
  );
  writeSnapshot(snapshot);
}

export function markMessageReleased(messageId: string): void {
  const snapshot = readSnapshot();
  snapshot.inbox = snapshot.inbox.map((m) =>
    m.id === messageId ? { ...m, status: 'released' } : m,
  );
  writeSnapshot(snapshot);
}

export function resultsTextFromMessage(message: InboundMachineMessage): string {
  return formatResultsText(message.parsedLines);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
