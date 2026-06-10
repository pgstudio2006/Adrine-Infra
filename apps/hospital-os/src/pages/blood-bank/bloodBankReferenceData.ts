export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent = 'Whole Blood' | 'PRBC' | 'FFP' | 'Platelets' | 'Cryo';

export type DonorRecord = {
  donorId: string;
  name: string;
  bloodGroup: BloodGroup;
  age: number;
  gender: 'M' | 'F';
  type: 'Voluntary' | 'Replacement';
  lastDonation?: string;
  eligible: boolean;
  deferralReason?: string;
};

export type BloodUnit = {
  unitId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  collectionDate: string;
  expiryDate: string;
  status: 'Quarantine' | 'Available' | 'Reserved' | 'Issued' | 'Expired';
  tti: { hiv: string; hbsag: string; hcv: string; vdrl: string; malaria: string };
  temperatureC: number;
};

export type BloodRequisition = {
  reqId: string;
  patientName: string;
  uhid: string;
  ward: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  urgency: 'Routine' | 'Emergency';
  crossMatch?: string;
  status: 'Pending' | 'Cross-matched' | 'Issued';
};

export const DONORS: DonorRecord[] = [
  { donorId: 'DNR-1001', name: 'Vikram Singh', bloodGroup: 'O+', age: 28, gender: 'M', type: 'Voluntary', lastDonation: '2025-11-12', eligible: true },
  { donorId: 'DNR-1002', name: 'Sunita Rao', bloodGroup: 'B+', age: 34, gender: 'F', type: 'Voluntary', eligible: true },
  { donorId: 'DNR-1003', name: 'Arjun Mehta', bloodGroup: 'A-', age: 22, gender: 'M', type: 'Replacement', lastDonation: '2026-01-05', eligible: false, deferralReason: 'Hb below threshold' },
  { donorId: 'DNR-1004', name: 'Priya Nair', bloodGroup: 'AB+', age: 31, gender: 'F', type: 'Voluntary', lastDonation: '2025-08-20', eligible: true },
];

export const BLOOD_UNITS: BloodUnit[] = [
  {
    unitId: 'BB-U-24001',
    bloodGroup: 'O+',
    component: 'PRBC',
    collectionDate: '2026-06-05',
    expiryDate: '2026-07-05',
    status: 'Available',
    tti: { hiv: 'Non-reactive', hbsag: 'Non-reactive', hcv: 'Non-reactive', vdrl: 'Non-reactive', malaria: 'Negative' },
    temperatureC: 4.2,
  },
  {
    unitId: 'BB-U-24002',
    bloodGroup: 'B+',
    component: 'FFP',
    collectionDate: '2026-06-04',
    expiryDate: '2027-06-04',
    status: 'Reserved',
    tti: { hiv: 'Non-reactive', hbsag: 'Non-reactive', hcv: 'Non-reactive', vdrl: 'Non-reactive', malaria: 'Negative' },
    temperatureC: -28,
  },
  {
    unitId: 'BB-U-24003',
    bloodGroup: 'A+',
    component: 'Platelets',
    collectionDate: '2026-06-07',
    expiryDate: '2026-06-08',
    status: 'Available',
    tti: { hiv: 'Non-reactive', hbsag: 'Non-reactive', hcv: 'Non-reactive', vdrl: 'Non-reactive', malaria: 'Negative' },
    temperatureC: 22,
  },
  {
    unitId: 'BB-U-23998',
    bloodGroup: 'O-',
    component: 'PRBC',
    collectionDate: '2026-05-20',
    expiryDate: '2026-06-20',
    status: 'Quarantine',
    tti: { hiv: 'Non-reactive', hbsag: 'Reactive', hcv: 'Non-reactive', vdrl: 'Non-reactive', malaria: 'Negative' },
    temperatureC: 4.0,
  },
];

export const REQUISITIONS: BloodRequisition[] = [
  { reqId: 'BR-501', patientName: 'Anita Sharma', uhid: 'UH-2024-0045', ward: 'ICU-2', bloodGroup: 'O+', component: 'PRBC', units: 2, urgency: 'Emergency', status: 'Pending' },
  { reqId: 'BR-502', patientName: 'Rahul Verma', uhid: 'UH-2024-0230', ward: 'Surgery', bloodGroup: 'B+', component: 'FFP', units: 1, urgency: 'Routine', crossMatch: 'Compatible', status: 'Cross-matched' },
];
