// ── AI Engine Output Types ──

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertCategory =
  | 'drug-safety'
  | 'critical-lab'
  | 'vital-deterioration'
  | 'antibiotic-stewardship'
  | 'los-outlier'
  | 'revenue-leakage'
  | 'collection-risk'
  | 'discount-abuse'
  | 'bed-capacity'
  | 'queue-bottleneck'
  | 'emergency-surge'
  | 'discharge-delay'
  | 'department-overload'
  | 'pharmacy-stock'
  | 'billing-gap';

export interface IntelligenceAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedEntity?: string;
  relatedId?: string;
  timestamp: string;
  actionable: boolean;
  suggestedAction?: string;
}

// ── Clinical Types ──

export interface DrugSafetyAlert {
  type: 'allergy-cross-reactivity' | 'drug-interaction';
  severity: AlertSeverity;
  drug: string;
  conflictWith: string;
  message: string;
  recommendation: string;
}

export interface CriticalValueAlert {
  testName: string;
  value: number;
  unit: string;
  normalRange: { low: number; high: number };
  criticalRange: { criticalLow: number; criticalHigh: number };
  severity: AlertSeverity;
  message: string;
  isCriticalLow: boolean;
  isCriticalHigh: boolean;
}

export interface AntibioticStewardshipEntry {
  uhid: string;
  patientName: string;
  admissionId: string;
  antibiotics: string[];
  daysSinceAdmission: number;
  recommendation: string;
}

export interface LOSOutlier {
  uhid: string;
  patientName: string;
  admissionId: string;
  ward: string;
  daysSinceAdmission: number;
  averageLOS: number;
  status: string;
  reason: string;
}

export interface VitalTrendEntry {
  uhid: string;
  patientName: string;
  admissionId: string;
  ward: string;
  bed: string;
  latestVitals: {
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
    painScore: number;
    recordedAt: string;
  };
  flags: string[];
  trend: 'stable' | 'improving' | 'deteriorating' | 'critical';
}

export interface ClinicalIntelligence {
  antibioticStewardship: AntibioticStewardshipEntry[];
  losOutliers: LOSOutlier[];
  vitalTrends: VitalTrendEntry[];
  monitoringAlerts: IntelligenceAlert[];
}

// ── Financial Types ──

export interface RevenueLeakageEntry {
  type: 'unbilled-admission' | 'unbilled-prescription';
  uhid: string;
  patientName: string;
  relatedId: string;
  estimatedAmount?: number;
  description: string;
}

export interface DepartmentProfitability {
  department: string;
  revenue: number;
  invoiceCount: number;
  paidAmount: number;
  pendingAmount: number;
  collectionRate: number;
}

export interface DiscountAbuseEntry {
  admissionId: string;
  uhid: string;
  patientName: string;
  discountAmount: number;
  totalBill: number;
  discountPercent: number;
  reason?: string;
}

export interface DailyFinancialDigest {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  invoiceCount: number;
  collectionRate: number;
  topDepartment: string;
  topDepartmentRevenue: number;
}

export interface FinancialIntelligence {
  revenueLeakage: RevenueLeakageEntry[];
  overallCollectionRate: number;
  departmentProfitability: DepartmentProfitability[];
  discountAbuse: DiscountAbuseEntry[];
  dailyDigest: DailyFinancialDigest;
  alerts: IntelligenceAlert[];
}

// ── Operations Types ──

export interface WardOccupancy {
  ward: string;
  occupied: number;
  capacity: number;
  occupancyRate: number;
  status: 'normal' | 'high' | 'critical' | 'over-capacity';
}

export interface QueueMetrics {
  totalInQueue: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  skipped: number;
  averageWaitEstimate: number;
  longestWaitingToken?: number;
  departmentBreakdown: { department: string; waiting: number; inConsultation: number }[];
}

export interface EmergencyLoadMetrics {
  totalActive: number;
  byTriage: { level: string; count: number }[];
  surgeAlert: boolean;
  surgeMessage?: string;
  unTriagedCount: number;
}

export interface DischargeDelay {
  admissionId: string;
  uhid: string;
  patientName: string;
  ward: string;
  bed: string;
  hoursWaiting: number;
  dischargeReadyAt: string;
}

export interface DepartmentActivity {
  department: string;
  activeCases: number;
  pendingTasks: number;
  loadPercent: number;
  status: 'normal' | 'busy' | 'overloaded';
}

export interface OperationsIntelligence {
  bedOccupancy: WardOccupancy[];
  queueMetrics: QueueMetrics;
  emergencyLoad: EmergencyLoadMetrics;
  dischargeDelays: DischargeDelay[];
  departmentActivity: DepartmentActivity[];
  alerts: IntelligenceAlert[];
}

// ── Strategic Intelligence Types (Layer 4) ──

export interface DemographicBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface ServiceLineRevenue {
  category: string;
  invoiceCount: number;
  totalRevenue: number;
  avgRevenue: number;
}

export interface ScoreFactor {
  name: string;
  value: number;
  weight: number;
  normalized: number;
}

export interface ScoreResult {
  name: string;
  score: number;
  factors: ScoreFactor[];
  label?: string;
}

export interface RetentionSummary {
  totalRegistered: number;
  patientsWithRevisit: number;
  retentionRate: number;
}

export interface ReferralEntry {
  source: string;
  type: 'doctor' | 'hospital' | 'other';
  count: number;
}

export interface PayerMixEntry {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CatchmentArea {
  branch: string;
  patientCount: number;
  percentage: number;
}

export interface StrategicIntelligence {
  ageDemographics: DemographicBucket[];
  genderDemographics: DemographicBucket[];
  categoryDemographics: DemographicBucket[];
  serviceLineRevenue: ServiceLineRevenue[];
  doctorPerformance: ScoreResult[];
  retention: RetentionSummary;
  referralNetwork: ReferralEntry[];
  payerMix: PayerMixEntry[];
  catchmentAreas: CatchmentArea[];
  alerts: IntelligenceAlert[];
}

// ── Revenue Cycle Intelligence Types (Layer 5) ──

export interface CollectionDashboard {
  totalBilled: number;
  totalCollected: number;
  collectionRate: number;
  outstandingAmount: number;
  byPaymentMethod: { method: string; amount: number; count: number }[];
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  color: string;
}

export interface PreAuthSummary {
  status: string;
  count: number;
  percentage: number;
}

export interface BillingError {
  invoiceId: string;
  patientName: string;
  errorType: 'zero-total' | 'overpayment' | 'duplicate';
  description: string;
}

export interface RevenueCycleIntelligence {
  collection: CollectionDashboard;
  aging: AgingBucket[];
  preAuth: PreAuthSummary[];
  billingErrors: BillingError[];
  alerts: IntelligenceAlert[];
}

// ── Workforce Intelligence Types (Layer 2) ──

export interface StaffWorkload {
  name: string;
  role: 'nurse' | 'doctor';
  taskCount: number;
  loadStatus: 'overloaded' | 'optimal' | 'underutilized';
  score: number;
}

export interface ShiftCoverage {
  shift: string;
  roundCount: number;
  uniqueNurses: number;
  coverageStatus: 'adequate' | 'gap';
}

export interface WorkforceIntelligence {
  staffWorkload: StaffWorkload[];
  shiftCoverage: ShiftCoverage[];
  doctorProductivity: ScoreResult[];
  alerts: IntelligenceAlert[];
}

// ── Procurement Intelligence Types (Layer 7) ──

export interface ReorderAlert {
  itemId: string;
  drug: string;
  currentQty: number;
  reorderLevel: number;
  urgency: 'critical' | 'high' | 'medium';
  daysUntilStockout: number;
  supplier: string;
}

export interface ExpiryRisk {
  itemId: string;
  drug: string;
  batch: string;
  expiryDate: string;
  daysUntilExpiry: number;
  qty: number;
  financialRisk: number;
}

export interface ConsumptionAnomaly {
  drug: string;
  prescriptionCount: number;
  currentStock: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface VendorConcentration {
  supplier: string;
  itemCount: number;
  percentage: number;
  isConcentrated: boolean;
}

export interface ProcurementIntelligence {
  reorderAlerts: ReorderAlert[];
  expiryRisks: ExpiryRisk[];
  consumptionAnomalies: ConsumptionAnomaly[];
  vendorConcentration: VendorConcentration[];
  costPerPatient: number;
  totalInventoryValue: number;
  alerts: IntelligenceAlert[];
}

// ── Morning Briefing (Command Center) ──
export interface MorningBriefingKPI {
  label: string;
  value: string;
  trend?: string;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  icon?: string;
}

export interface MorningBriefing {
  healthScore: number;
  healthLabel: string;
  topAlerts: IntelligenceAlert[];
  kpis: MorningBriefingKPI[];
  briefingSections: { title: string; icon: string; lines: { text: string; type: 'info' | 'success' | 'warning' | 'critical' }[] }[];
  generatedAt: string;
  advice: string[];
}
