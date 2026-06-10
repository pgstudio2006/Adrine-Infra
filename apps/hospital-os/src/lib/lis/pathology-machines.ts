export type PathologyMachine = {
  id: string;
  name: string;
  make: string;
  model: string;
  section: string;
  protocol: 'HL7 v2 ORU' | 'HL7 ASTM' | 'Serial';
  host: string;
  port: number;
};

export const PATHOLOGY_MACHINES: PathologyMachine[] = [
  {
    id: 'sysmex-xt1000',
    name: '5-Part Haematology Analyser XT-1000',
    make: 'Sysmex',
    model: 'XT-1000',
    section: 'Hematology',
    protocol: 'HL7 v2 ORU',
    host: '192.168.10.11',
    port: 5001,
  },
  {
    id: 'transasia-elite580',
    name: '5-Part Haematology Analyser Elite 580',
    make: 'Transasia',
    model: 'Elite 580',
    section: 'Hematology',
    protocol: 'HL7 ASTM',
    host: '192.168.10.12',
    port: 5002,
  },
  {
    id: 'biomerieux-bactalert',
    name: 'Blood Culture Analyser BACT/ALERT',
    make: 'Biomérieux',
    model: 'BACT/ALERT',
    section: 'Microbiology',
    protocol: 'HL7 v2 ORU',
    host: '192.168.10.21',
    port: 5003,
  },
  {
    id: 'biomerieux-vitek',
    name: 'ID & Sensitivity Analyser VITEK',
    make: 'Biomérieux',
    model: 'VITEK 2',
    section: 'Microbiology',
    protocol: 'HL7 v2 ORU',
    host: '192.168.10.22',
    port: 5004,
  },
  {
    id: 'dyses-chemistry',
    name: 'Clinical Chemistry Analyser',
    make: 'Dyses',
    model: 'DYS-CHEM',
    section: 'Biochemistry',
    protocol: 'Serial',
    host: '192.168.10.31',
    port: 5005,
  },
  {
    id: 'biorad-d10',
    name: 'HPLC Analyser D10',
    make: 'BioRad',
    model: 'D-10',
    section: 'Biochemistry',
    protocol: 'HL7 ASTM',
    host: '192.168.10.32',
    port: 5006,
  },
  {
    id: 'biomerieux-vidas',
    name: 'Immunoassay Analyser VIDAS',
    make: 'Biomérieux',
    model: 'VIDAS',
    section: 'Serology',
    protocol: 'HL7 v2 ORU',
    host: '192.168.10.41',
    port: 5007,
  },
  {
    id: 'transasia-ecl412',
    name: 'Coagulation Analyser ECL 412',
    make: 'Transasia',
    model: 'ECL 412',
    section: 'Hematology',
    protocol: 'HL7 ASTM',
    host: '192.168.10.13',
    port: 5008,
  },
];

export type MachineResultLine = {
  test: string;
  value: string;
  unit: string;
  flag: 'N' | 'H' | 'L' | 'C';
  reference: string;
};

export type InboundMachineMessage = {
  id: string;
  machineId: string;
  receivedAt: string;
  sampleBarcode: string;
  patientName: string;
  uhid: string;
  rawHl7: string;
  parsedLines: MachineResultLine[];
  status: 'pending' | 'matched' | 'released';
};

export function buildDemoHl7(machine: PathologyMachine, sampleBarcode: string, patientName: string): string {
  const ts = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
  return [
    `MSH|^~\\&|${machine.make}|${machine.model}|ADRINE_LIS|MIDDLEWARE|${ts}||ORU^R01|MSG${Date.now()}|P|2.5`,
    `PID|1||UHID240001||${patientName.replace(' ', '^')}||`,
    `OBR|1|${sampleBarcode}||CBC^Complete Blood Count`,
    `OBX|1|NM|WBC^White Blood Cells||7.2|10^3/uL|4.0-11.0|N|||F`,
    `OBX|2|NM|RBC^Red Blood Cells||4.8|10^6/uL|4.5-5.5|N|||F`,
    `OBX|3|NM|HGB^Hemoglobin||14.1|g/dL|12.0-17.0|N|||F`,
    `OBX|4|NM|PLT^Platelets||245|10^3/uL|150-410|N|||F`,
  ].join('\r');
}

export function demoResultsForMachine(machineId: string): MachineResultLine[] {
  const map: Record<string, MachineResultLine[]> = {
    'sysmex-xt1000': [
      { test: 'WBC', value: '7.2', unit: '10³/µL', flag: 'N', reference: '4.0–11.0' },
      { test: 'RBC', value: '4.82', unit: '10⁶/µL', flag: 'N', reference: '4.5–5.5' },
      { test: 'HGB', value: '14.1', unit: 'g/dL', flag: 'N', reference: '12.0–17.0' },
      { test: 'PLT', value: '245', unit: '10³/µL', flag: 'N', reference: '150–410' },
    ],
    'transasia-elite580': [
      { test: 'WBC', value: '6.9', unit: '10³/µL', flag: 'N', reference: '4.0–11.0' },
      { test: 'NEU%', value: '58', unit: '%', flag: 'N', reference: '40–70' },
      { test: 'LYM%', value: '32', unit: '%', flag: 'N', reference: '20–40' },
    ],
    'biomerieux-bactalert': [
      { test: 'Blood Culture', value: 'No growth at 48h', unit: '', flag: 'N', reference: 'Negative' },
    ],
    'biomerieux-vitek': [
      { test: 'Organism', value: 'E. coli', unit: '', flag: 'N', reference: '—' },
      { test: 'Ciprofloxacin', value: 'Sensitive', unit: '', flag: 'N', reference: 'S/I/R' },
    ],
    'dyses-chemistry': [
      { test: 'FBS', value: '98', unit: 'mg/dL', flag: 'N', reference: '70–100' },
      { test: 'Creatinine', value: '1.1', unit: 'mg/dL', flag: 'N', reference: '0.6–1.3' },
      { test: 'SGOT', value: '28', unit: 'U/L', flag: 'N', reference: '5–40' },
      { test: 'SGPT', value: '32', unit: 'U/L', flag: 'N', reference: '7–56' },
    ],
    'biorad-d10': [
      { test: 'HbA1c', value: '6.2', unit: '%', flag: 'H', reference: '4.0–5.6' },
    ],
    'biomerieux-vidas': [
      { test: 'TSH', value: '2.4', unit: 'µIU/mL', flag: 'N', reference: '0.4–4.0' },
      { test: 'Vitamin D', value: '18', unit: 'ng/mL', flag: 'L', reference: '30–100' },
    ],
    'transasia-ecl412': [
      { test: 'PT', value: '12.4', unit: 'sec', flag: 'N', reference: '11–13.5' },
      { test: 'INR', value: '1.05', unit: '', flag: 'N', reference: '0.8–1.2' },
    ],
  };
  return map[machineId] ?? [{ test: 'Result', value: 'See instrument', unit: '', flag: 'N', reference: '—' }];
}

export function formatResultsText(lines: MachineResultLine[]): string {
  return lines
    .map((line) => `${line.test}: ${line.value} ${line.unit} [${line.flag}] (Ref: ${line.reference})`)
    .join('\n');
}
