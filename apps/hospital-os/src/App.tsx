import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getPlatformSession, isPlatformRuntimeEnabled } from "@/runtime/platform-session";
import { TenantSettingsProvider } from "@/contexts/TenantSettingsContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { HospitalProvider } from "@/stores/hospitalStore";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AppLayout from "@/components/AppLayout";
import RolePlaceholder from "@/components/RolePlaceholder";
import { ROLE_BASE_PATH, ROLE_TABS } from "@/config/roleNavigation";
import NotFound from "./pages/NotFound";

// Doctor pages
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorQueue from "@/pages/doctor/DoctorQueue";
import DoctorSchedule from "@/pages/doctor/DoctorSchedule";
import DoctorLabs from "@/pages/doctor/DoctorLabs";
import DoctorIPD from "@/pages/doctor/DoctorIPD";
import DoctorAnalytics from "@/pages/doctor/DoctorAnalytics";
import DoctorPatientProfile from "@/pages/doctor/DoctorPatientProfile";
import DoctorIPDPatientProfile from "@/pages/doctor/DoctorIPDPatientProfile";
import DoctorConsultation from "@/pages/doctor/DoctorConsultation";
import DoctorRadiology from "@/pages/doctor/DoctorRadiology";
import {
  DoctorAI,
  DoctorCritical,
  DoctorCredentials,
  DoctorDeathMLC,
  DoctorDischarge,
  DoctorEMR,
  DoctorEMRPatient,
  DoctorInbox,
  DoctorOnCall,
  DoctorOrderSets,
  DoctorOT,
  DoctorPriorAuth,
  DoctorProcedures,
  DoctorReferrals,
  DoctorTeleconsult,
  DoctorTemplates,
} from "@/pages/doctor/DoctorPlannedScreens";

// Nurse pages
import NurseDashboard from "@/pages/nurse/NurseDashboard";
import NurseTaskBoard from "@/pages/nurse/NurseTaskBoard";
import NurseWard from "@/pages/nurse/NurseWard";
import NurseAdmissions from "@/pages/nurse/NurseAdmissions";
import NurseTasks from "@/pages/nurse/NurseTasks";
import NurseMedications from "@/pages/nurse/NurseMedications";
import NurseVitals from "@/pages/nurse/NurseVitals";
import NurseDischarge from "@/pages/nurse/NurseDischarge";
import NurseReports from "@/pages/nurse/NurseReports";
import NurseVitalsChart from "@/pages/nurse/NurseVitalsChart";
import NurseNotesEditor from "@/pages/nurse/NurseNotesEditor";
import NurseShift from "@/pages/nurse/NurseShift";
import NurseAssessments from "@/pages/nurse/NurseAssessments";
import NurseCarePlan from "@/pages/nurse/NurseCarePlan";
import NurseIO from "@/pages/nurse/NurseIO";
import NurseOrders from "@/pages/nurse/NurseOrders";
import {
  NurseBloodAdmin,
  NurseIVTherapy,
  NurseWoundCare,
  NurseRestraints,
  NurseCodeBlue,
  NurseFallRisk,
  NursePressureInjury,
  NurseSepsis,
  NursePain,
  NurseBehavior,
  NurseEducation,
} from "@/pages/nurse/NursePlannedScreens";

// Reception pages
import ReceptionDashboard from "@/pages/reception/ReceptionDashboard";
import ReceptionRegistration from "@/pages/reception/ReceptionRegistration";
import ReceptionAppointments from "@/pages/reception/ReceptionAppointments";
import ReceptionCheckIn from "@/pages/reception/ReceptionCheckIn";
import ReceptionQueue from "@/pages/reception/ReceptionQueue";
import ReceptionBilling from "@/pages/reception/ReceptionBilling";
import ReceptionBeds from "@/pages/reception/ReceptionBeds";
import ReceptionIPD from "@/pages/reception/ReceptionIPD";
import ReceptionPatientPhotos from "@/pages/reception/ReceptionPatientPhotos";
import ReceptionVisitors from "@/pages/reception/ReceptionVisitors";
import ReceptionHandover from "@/pages/reception/ReceptionHandover";
import {
  ReceptionInsuranceVerification,
  ReceptionDischargeClearance,
  ReceptionPrintCenter,
  ReceptionDocumentScan,
  ReceptionEnquiries,
  ReceptionBranches,
  ReceptionFeedback,
} from "@/pages/reception/ReceptionPlannedScreens";
import CrmDripCampaigns from "@/pages/crm/CrmDripCampaigns";

// Lab pages
import LabDashboard from "@/pages/lab/LabDashboard";
import LabWorklist from "@/pages/lab/LabWorklist";
import LabSamples from "@/pages/lab/LabSamples";
import LabEntry from "@/pages/lab/LabEntry";
import LabVerification from "@/pages/lab/LabVerification";
import LabReports from "@/pages/lab/LabReports";
import LabCritical from "@/pages/lab/LabCritical";
import LabOrders from "@/pages/lab/LabOrders";
import LabPhlebotomy from "@/pages/lab/LabPhlebotomy";
import LabAccession from "@/pages/lab/LabAccession";
import LabSections from "@/pages/lab/LabSections";
import LabAmendments from "@/pages/lab/LabAmendments";
import LabAudit from "@/pages/lab/LabAudit";
import LabTat from "@/pages/lab/LabTat";
import LabBillingHandoff from "@/pages/lab/LabBillingHandoff";
import LabStorage from "@/pages/lab/LabStorage";
import LabCatalog from "@/pages/lab/LabCatalog";
import LabQc from "@/pages/lab/LabQc";
import LabAnalyzers from "@/pages/lab/LabAnalyzers";
import LabReferral from "@/pages/lab/LabReferral";
import LabConsumables from "@/pages/lab/LabConsumables";
import LabHisto from "@/pages/lab/LabHisto";

// Blood Bank pages
import BloodBankDashboard from "@/pages/blood-bank/BloodBankDashboard";
import BloodBankDonors from "@/pages/blood-bank/BloodBankDonors";
import BloodBankInventory from "@/pages/blood-bank/BloodBankInventory";
import BloodBankIssue from "@/pages/blood-bank/BloodBankIssue";
import BloodBankCompliance from "@/pages/blood-bank/BloodBankCompliance";

// Pharmacy pages
import PharmacyDashboard from "@/pages/pharmacy/PharmacyDashboard";
import PharmacyPrescriptions from "@/pages/pharmacy/PharmacyPrescriptions";
import PharmacyInventory from "@/pages/pharmacy/PharmacyInventory";
import PharmacyDrugs from "@/pages/pharmacy/PharmacyDrugs";
import PharmacyBilling from "@/pages/pharmacy/PharmacyBilling";
import PharmacyReports from "@/pages/pharmacy/PharmacyReports";
import PharmacySuppliers from "@/pages/pharmacy/PharmacySuppliers";
import PharmacyPurchase from "@/pages/pharmacy/PharmacyPurchase";
import PharmacyQueries from "@/pages/pharmacy/PharmacyQueries";
import PharmacyScheduleH from "@/pages/pharmacy/PharmacyScheduleH";
import PharmacyIndent from "@/pages/pharmacy/PharmacyIndent";
import PharmacyReturns from "@/pages/pharmacy/PharmacyReturns";
import {
  PharmacyFormulary,
  PharmacyNarcotics,
  PharmacyExpiry,
  PharmacyAuditTrail,
  PharmacyBarcodeDispense,
  PharmacyCounseling,
  PharmacyRefills,
  PharmacyCompounding,
  PharmacyColdChain,
  PharmacyInteractions,
} from "@/pages/pharmacy/PharmacyPlannedScreens";

// Radiology pages
import RadiologyDashboard from "@/pages/radiology/RadiologyDashboard";
import RadiologyOrders from "@/pages/radiology/RadiologyOrders";
import RadiologyWorklist from "@/pages/radiology/RadiologyWorklist";
import RadiologyReports from "@/pages/radiology/RadiologyReports";
import RadiologySettings from "@/pages/radiology/RadiologySettings";
import {
  RadiologyCriticalCallback,
  RadiologyTemplates,
  RadiologySchedule,
  RadiologyContrast,
  RadiologyTAT,
  RadiologyAmendments,
  RadiologyPeerReview,
  RadiologyDoseRegistry,
  RadiologyTelerad,
  RadiologyPACS,
  RadiologyModalityWorklist,
} from "@/pages/radiology/RadiologyPlannedScreens";

// Admin pages
import AdminStaffRoute from "@/components/admin/AdminStaffRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminDepartments from "@/pages/admin/AdminDepartments";
import AdminFinance from "@/pages/admin/AdminFinance";
import AdminExpenses from "@/pages/admin/AdminExpenses";
import AdminApprovals from "@/pages/admin/AdminApprovals";
import AdminClaims from "@/pages/admin/AdminClaims";
import AdminMRD from "@/pages/admin/AdminMRD";
import AdminMIS from "@/pages/admin/AdminMIS";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminSettings from "@/pages/admin/AdminSettings";
import PlatformAdminHub from "@/pages/admin/PlatformAdminHub";
import OnboardingWizard from "@/pages/admin/OnboardingWizard";
import AdminGeoIntelligence from "@/pages/admin/AdminGeoIntelligence";
import AdminDoctorSharing from "@/pages/admin/AdminDoctorSharing";
import AdminPhonebook from "@/pages/admin/AdminPhonebook";
import AdminMortalityAnalytics from "@/pages/admin/AdminMortalityAnalytics";
import AdminAIWorkflow from "@/pages/admin/AdminAIWorkflow";
import AdminDiseaseMapping from "@/pages/admin/AdminDiseaseMapping";
import AdminDataMining from "@/pages/admin/AdminDataMining";
import AdminCommandCenter from "@/pages/admin/AdminCommandCenter";
import AdminKaizen from "@/pages/admin/AdminKaizen";
import AdminRevenueCycle from "@/pages/admin/AdminRevenueCycle";
import AdminTreatmentSuccess from "@/pages/admin/AdminTreatmentSuccess";
import AdminMorningBriefing from "@/pages/admin/AdminMorningBriefing";

// Billing pages
import BillingDashboard from "@/pages/billing/BillingDashboard";
import BillingInvoices from "@/pages/billing/BillingInvoices";
import BillingPayments from "@/pages/billing/BillingPayments";
import BillingIPD from "@/pages/billing/BillingIPD";
import BillingPackages from "@/pages/billing/BillingPackages";
import NavayuCounsellorDesk from "@/pages/billing/NavayuCounsellorDesk";
import BillingRevenue from "@/pages/billing/BillingRevenue";
import BillingInsurance from "@/pages/billing/BillingInsurance";
import BillingFinance from "@/pages/billing/BillingFinance";
import BillingReports from "@/pages/billing/BillingReports";
import BillingHealthPlans from "@/pages/billing/BillingHealthPlans";
import BillingGST from "@/pages/billing/BillingGST";
import BillingTPACharges from "@/pages/billing/BillingTPACharges";
import BillingPreAuth from "@/pages/billing/BillingPreAuth";
import BillingReconciliation from "@/pages/billing/BillingReconciliation";
import BillingChargeMaster from "@/pages/billing/BillingChargeMaster";
import BillingCashier from "@/pages/billing/BillingCashier";
import {
  BillingTPADesk,
  BillingCopay,
  BillingECL,
  BillingClaims,
  BillingDenials,
  BillingPharmacyBilling,
  BillingCorporateBilling,
  BillingCopayAudit,
  BillingSchemeBilling,
  BillingSettlement,
} from "@/pages/billing/BillingPlannedScreens";

// OT pages
import OTDashboard from "@/pages/ot/OTDashboard";
import OTBoard from "@/pages/ot/OTBoard";
import OTSchedule from "@/pages/ot/OTSchedule";
import OTRooms from "@/pages/ot/OTRooms";
import OTTeams from "@/pages/ot/OTTeams";
import OTPreOp from "@/pages/ot/OTPreOp";
import OTIntraOp from "@/pages/ot/OTIntraOp";
import OTPostOp from "@/pages/ot/OTPostOp";
import OTInventory from "@/pages/ot/OTInventory";
import OTReports from "@/pages/ot/OTReports";
import OTAnalytics from "@/pages/ot/OTAnalytics";

// Inventory pages
import InventoryDashboard from "@/pages/inventory/InventoryDashboard";
import InventoryCatalog from "@/pages/inventory/InventoryCatalog";
import InventoryStockEntry from "@/pages/inventory/InventoryStockEntry";
import InventoryDistribution from "@/pages/inventory/InventoryDistribution";
import InventoryRequisitions from "@/pages/inventory/InventoryRequisitions";
import InventoryPurchaseOrders from "@/pages/inventory/InventoryPurchaseOrders";
import InventoryAdjustments from "@/pages/inventory/InventoryAdjustments";
import InventoryEquipment from "@/pages/inventory/InventoryEquipment";
import InventoryReports from "@/pages/inventory/InventoryReports";
import InventoryIssue from "@/pages/inventory/InventoryIssue";
import InventoryGrn from "@/pages/inventory/InventoryGrn";

// Emergency pages
import EmergencyDashboard from "@/pages/emergency/EmergencyDashboard";
import EmergencyTriage from "@/pages/emergency/EmergencyTriage";
import EmergencyCases from "@/pages/emergency/EmergencyCases";
import EmergencyTreatment from "@/pages/emergency/EmergencyTreatment";
import EmergencyOrders from "@/pages/emergency/EmergencyOrders";
import EmergencyObservation from "@/pages/emergency/EmergencyObservation";
import EmergencyMLC from "@/pages/emergency/EmergencyMLC";
import EmergencyAmbulance from "@/pages/emergency/EmergencyAmbulance";
import EmergencyReports from "@/pages/emergency/EmergencyReports";

// HR pages
import HRDashboard from "@/pages/hr/HRDashboard";
import HRStaff from "@/pages/hr/HRStaff";
import HRScheduling from "@/pages/hr/HRScheduling";
import HRAttendance from "@/pages/hr/HRAttendance";
import HRLeave from "@/pages/hr/HRLeave";
import HRCredentials from "@/pages/hr/HRCredentials";
import HRTraining from "@/pages/hr/HRTraining";
import HRPerformance from "@/pages/hr/HRPerformance";
import HRReports from "@/pages/hr/HRReports";

// Scheduling pages
import SchedulingDashboard from "@/pages/scheduling/SchedulingDashboard";
import SchedulingBook from "@/pages/scheduling/SchedulingBook";
import SchedulingCalendar from "@/pages/scheduling/SchedulingCalendar";
import SchedulingDoctors from "@/pages/scheduling/SchedulingDoctors";
import SchedulingResources from "@/pages/scheduling/SchedulingResources";
import SchedulingWaitlist from "@/pages/scheduling/SchedulingWaitlist";
import SchedulingTeleconsult from "@/pages/scheduling/SchedulingTeleconsult";
import SchedulingReports from "@/pages/scheduling/SchedulingReports";

// Dialysis pages
import DialysisDashboard from "@/pages/dialysis/DialysisDashboard";
import DialysisPatients from "@/pages/dialysis/DialysisPatients";
import DialysisSchedule from "@/pages/dialysis/DialysisSchedule";
import DialysisSession from "@/pages/dialysis/DialysisSession";
import DialysisMachines from "@/pages/dialysis/DialysisMachines";
import DialysisConsumables from "@/pages/dialysis/DialysisConsumables";
import DialysisBilling from "@/pages/dialysis/DialysisBilling";
import DialysisReports from "@/pages/dialysis/DialysisReports";

// CRM pages
import CRMDashboard from "@/pages/crm/CRMDashboard";
import LeadManagement from "@/pages/crm/LeadManagement";
import Campaigns from "@/pages/crm/Campaigns";
import FeedbackSurveys from "@/pages/crm/FeedbackSurveys";
import PatientLifecycle from "@/pages/crm/PatientLifecycle";
import CRMAnalytics from "@/pages/crm/CRMAnalytics";

const queryClient = new QueryClient();

const ADMIN_PAGES: Record<string, React.ComponentType> = {
  "/admin": AdminDashboard,
  "/admin/command-center": AdminCommandCenter,
  "/admin/mortality": AdminMortalityAnalytics,
  "/admin/ai-workflow": AdminAIWorkflow,
  "/admin/disease-mapping": AdminDiseaseMapping,
  "/admin/geo-intelligence": AdminGeoIntelligence,
  "/admin/data-mining": AdminDataMining,
  "/admin/kaizen": AdminKaizen,
  "/admin/revenue-cycle": AdminRevenueCycle,
  "/admin/treatment-success": AdminTreatmentSuccess,
  "/admin/morning-briefing": AdminMorningBriefing,
  "/admin/departments": AdminDepartments,
  "/admin/finance": AdminFinance,
  "/admin/expenses": AdminExpenses,
  "/admin/approvals": AdminApprovals,
  "/admin/claims": AdminClaims,
  "/admin/mrd": AdminMRD,
  "/admin/mis": AdminMIS,
  "/admin/audit": AdminAudit,
  "/admin/settings": AdminSettings,
  "/admin/platform": PlatformAdminHub,
  "/admin/onboarding": OnboardingWizard,
  "/admin/doctor-sharing": AdminDoctorSharing,
  "/admin/phonebook": AdminPhonebook,
};

const DOCTOR_PAGES: Record<string, React.ComponentType> = {
  "/doctor": DoctorDashboard,
  "/doctor/patients": DoctorPatients,
  "/doctor/queue": DoctorQueue,
  "/doctor/schedule": DoctorSchedule,
  "/doctor/labs": DoctorLabs,
  "/doctor/radiology": DoctorRadiology,
  "/doctor/ipd": DoctorIPD,
  "/doctor/analytics": DoctorAnalytics,
  "/doctor/inbox": DoctorInbox,
  "/doctor/critical": DoctorCritical,
  "/doctor/emr": DoctorEMR,
  "/doctor/on-call": DoctorOnCall,
  "/doctor/teleconsult": DoctorTeleconsult,
  "/doctor/templates": DoctorTemplates,
  "/doctor/order-sets": DoctorOrderSets,
  "/doctor/procedures": DoctorProcedures,
  "/doctor/referrals": DoctorReferrals,
  "/doctor/discharge": DoctorDischarge,
  "/doctor/ot": DoctorOT,
  "/doctor/prior-auth": DoctorPriorAuth,
  "/doctor/death-mlc": DoctorDeathMLC,
  "/doctor/credentials": DoctorCredentials,
  "/doctor/ai": DoctorAI,
};

const JR_DOCTOR_PAGES: Record<string, React.ComponentType> = {
  "/jr-doctor": DoctorDashboard,
  "/jr-doctor/queue": DoctorQueue,
  "/jr-doctor/patients": DoctorPatients,
};

const NURSE_PAGES: Record<string, React.ComponentType> = {
  "/nurse": NurseDashboard,
  "/nurse/shift": NurseShift,
  "/nurse/task-board": NurseTaskBoard,
  "/nurse/ward": NurseWard,
  "/nurse/admissions": NurseAdmissions,
  "/nurse/tasks": NurseTasks,
  "/nurse/orders": NurseOrders,
  "/nurse/medications": NurseMedications,
  "/nurse/vitals": NurseVitals,
  "/nurse/assessments": NurseAssessments,
  "/nurse/care-plan": NurseCarePlan,
  "/nurse/io": NurseIO,
  "/nurse/discharge": NurseDischarge,
  "/nurse/reports": NurseReports,
  "/nurse/blood-admin": NurseBloodAdmin,
  "/nurse/iv-therapy": NurseIVTherapy,
  "/nurse/wound-care": NurseWoundCare,
  "/nurse/restraints": NurseRestraints,
  "/nurse/code-blue": NurseCodeBlue,
  "/nurse/fall-risk": NurseFallRisk,
  "/nurse/pressure-injury": NursePressureInjury,
  "/nurse/sepsis": NurseSepsis,
  "/nurse/pain": NursePain,
  "/nurse/behavior": NurseBehavior,
  "/nurse/education": NurseEducation,
};

const RECEPTION_PAGES: Record<string, React.ComponentType> = {
  "/reception": ReceptionDashboard,
  "/reception/flow": () => <Navigate to="/reception" replace />,
  "/reception/registration": ReceptionRegistration,
  "/reception/appointments": ReceptionAppointments,
  "/reception/checkin": ReceptionCheckIn,
  "/reception/queue": ReceptionQueue,
  "/reception/billing": ReceptionBilling,
  "/reception/beds": ReceptionBeds,
  "/reception/ipd": ReceptionIPD,
  "/reception/photos": ReceptionPatientPhotos,
  "/reception/visitors": ReceptionVisitors,
  "/reception/handover": ReceptionHandover,
  "/reception/insurance": ReceptionInsuranceVerification,
  "/reception/discharge-clearance": ReceptionDischargeClearance,
  "/reception/print": ReceptionPrintCenter,
  "/reception/scan": ReceptionDocumentScan,
  "/reception/enquiries": ReceptionEnquiries,
  "/reception/branches": ReceptionBranches,
  "/reception/feedback": ReceptionFeedback,
};

const LAB_PAGES: Record<string, React.ComponentType> = {
  "/lab": LabDashboard,
  "/lab/orders": LabOrders,
  "/lab/phlebotomy": LabPhlebotomy,
  "/lab/accession": LabAccession,
  "/lab/worklist": LabWorklist,
  "/lab/sections": LabSections,
  "/lab/samples": LabSamples,
  "/lab/entry": LabEntry,
  "/lab/verification": LabVerification,
  "/lab/critical": LabCritical,
  "/lab/amendments": LabAmendments,
  "/lab/reports": LabReports,
  "/lab/audit": LabAudit,
  "/lab/tat": LabTat,
  "/lab/billing-handoff": LabBillingHandoff,
  "/lab/storage": LabStorage,
  "/lab/catalog": LabCatalog,
  "/lab/qc": LabQc,
  "/lab/analyzers": LabAnalyzers,
  "/lab/referral": LabReferral,
  "/lab/consumables": LabConsumables,
  "/lab/histo": LabHisto,
};

const BLOOD_BANK_PAGES: Record<string, React.ComponentType> = {
  "/blood-bank": BloodBankDashboard,
  "/blood-bank/donors": BloodBankDonors,
  "/blood-bank/inventory": BloodBankInventory,
  "/blood-bank/issue": BloodBankIssue,
  "/blood-bank/compliance": BloodBankCompliance,
};

const PHARMACY_PAGES: Record<string, React.ComponentType> = {
  "/pharmacy": PharmacyDashboard,
  "/pharmacy/prescriptions": PharmacyPrescriptions,
  "/pharmacy/inventory": PharmacyInventory,
  "/pharmacy/drugs": PharmacyDrugs,
  "/pharmacy/reports": PharmacyReports,
  "/pharmacy/billing": PharmacyBilling,
  "/pharmacy/suppliers": PharmacySuppliers,
  "/pharmacy/purchase": PharmacyPurchase,
  "/pharmacy/queries": PharmacyQueries,
  "/pharmacy/schedule-h": PharmacyScheduleH,
  "/pharmacy/formulary": PharmacyFormulary,
  "/pharmacy/indent": PharmacyIndent,
  "/pharmacy/returns": PharmacyReturns,
  "/pharmacy/narcotics": PharmacyNarcotics,
  "/pharmacy/expiry": PharmacyExpiry,
  "/pharmacy/audit": PharmacyAuditTrail,
  "/pharmacy/barcode": PharmacyBarcodeDispense,
  "/pharmacy/counseling": PharmacyCounseling,
  "/pharmacy/refills": PharmacyRefills,
  "/pharmacy/compounding": PharmacyCompounding,
  "/pharmacy/cold-chain": PharmacyColdChain,
  "/pharmacy/interactions": PharmacyInteractions,
};

const RADIOLOGY_PAGES: Record<string, React.ComponentType> = {
  "/radiology": RadiologyDashboard,
  "/radiology/orders": RadiologyOrders,
  "/radiology/worklist": RadiologyWorklist,
  "/radiology/reports": RadiologyReports,
  "/radiology/settings": RadiologySettings,
  "/radiology/critical": RadiologyCriticalCallback,
  "/radiology/templates": RadiologyTemplates,
  "/radiology/schedule": RadiologySchedule,
  "/radiology/contrast": RadiologyContrast,
  "/radiology/tat": RadiologyTAT,
  "/radiology/amendments": RadiologyAmendments,
  "/radiology/peer-review": RadiologyPeerReview,
  "/radiology/dose": RadiologyDoseRegistry,
  "/radiology/telerad": RadiologyTelerad,
  "/radiology/pacs": RadiologyPACS,
  "/radiology/modality-worklist": RadiologyModalityWorklist,
};

const BILLING_PAGES: Record<string, React.ComponentType> = {
  "/billing-dept": BillingDashboard,
  "/billing-dept/invoices": BillingInvoices,
  "/billing-dept/payments": BillingPayments,
  "/billing-dept/ipd-billing": BillingIPD,
  "/billing-dept/packages": BillingPackages,
  "/billing-dept/counselling": NavayuCounsellorDesk,
  "/billing-dept/revenue": BillingRevenue,
  "/billing-dept/insurance": BillingInsurance,
  "/billing-dept/finance": BillingFinance,
  "/billing-dept/reports": BillingReports,
  "/billing-dept/health-plans": BillingHealthPlans,
  "/billing-dept/gst": BillingGST,
  "/billing-dept/tpa-charges": BillingTPACharges,
  "/billing-dept/pre-auth": BillingPreAuth,
  "/billing-dept/reconciliation": BillingReconciliation,
  "/billing-dept/charge-master": BillingFinance,
  "/billing-dept/tpa-desk": BillingTPADesk,
  "/billing-dept/copay": BillingCopay,
  "/billing-dept/ecl": BillingECL,
  "/billing-dept/claims": BillingClaims,
  "/billing-dept/denials": BillingDenials,
  "/billing-dept/pharmacy-billing": BillingPharmacyBilling,
  "/billing-dept/corporate-billing": BillingCorporateBilling,
  "/billing-dept/cashier": BillingFinance,
  "/billing-dept/copay-audit": BillingCopayAudit,
  "/billing-dept/scheme-billing": BillingSchemeBilling,
  "/billing-dept/settlement": BillingSettlement,
};

const OT_PAGES: Record<string, React.ComponentType> = {
  "/ot": OTDashboard,
  "/ot/board": OTBoard,
  "/ot/schedule": OTSchedule,
  "/ot/rooms": OTRooms,
  "/ot/teams": OTTeams,
  "/ot/preop": OTPreOp,
  "/ot/intraop": OTIntraOp,
  "/ot/postop": OTPostOp,
  "/ot/inventory": OTInventory,
  "/ot/reports": OTReports,
  "/ot/analytics": OTAnalytics,
};

const INVENTORY_PAGES: Record<string, React.ComponentType> = {
  "/inventory": InventoryDashboard,
  "/inventory/issue": InventoryIssue,
  "/inventory/grn": InventoryGrn,
  "/inventory/catalog": InventoryCatalog,
  "/inventory/stock-entry": InventoryStockEntry,
  "/inventory/distribution": InventoryDistribution,
  "/inventory/requisitions": InventoryRequisitions,
  "/inventory/procurement": InventoryPurchaseOrders,
  "/inventory/adjustments": InventoryAdjustments,
  "/inventory/equipment": InventoryEquipment,
  "/inventory/reports": InventoryReports,
};

const EMERGENCY_PAGES: Record<string, React.ComponentType> = {
  "/emergency": EmergencyDashboard,
  "/emergency/triage": EmergencyTriage,
  "/emergency/cases": EmergencyCases,
  "/emergency/treatment": EmergencyTreatment,
  "/emergency/orders": EmergencyOrders,
  "/emergency/observation": EmergencyObservation,
  "/emergency/mlc": EmergencyMLC,
  "/emergency/ambulance": EmergencyAmbulance,
  "/emergency/reports": EmergencyReports,
};

const HR_PAGES: Record<string, React.ComponentType> = {
  "/hr": HRDashboard,
  "/hr/staff": HRStaff,
  "/hr/scheduling": HRScheduling,
  "/hr/attendance": HRAttendance,
  "/hr/leave": HRLeave,
  "/hr/credentials": HRCredentials,
  "/hr/training": HRTraining,
  "/hr/performance": HRPerformance,
  "/hr/reports": HRReports,
};

const SCHEDULING_PAGES: Record<string, React.ComponentType> = {
  "/scheduling": SchedulingDashboard,
  "/scheduling/book": SchedulingBook,
  "/scheduling/calendar": SchedulingCalendar,
  "/scheduling/doctors": SchedulingDoctors,
  "/scheduling/resources": SchedulingResources,
  "/scheduling/waitlist": SchedulingWaitlist,
  "/scheduling/teleconsult": SchedulingTeleconsult,
  "/scheduling/reports": SchedulingReports,
};

const DIALYSIS_PAGES: Record<string, React.ComponentType> = {
  "/dialysis": DialysisDashboard,
  "/dialysis/patients": DialysisPatients,
  "/dialysis/schedule": DialysisSchedule,
  "/dialysis/session": DialysisSession,
  "/dialysis/machines": DialysisMachines,
  "/dialysis/consumables": DialysisConsumables,
  "/dialysis/billing": DialysisBilling,
  "/dialysis/reports": DialysisReports,
};

const CRM_PAGES: Record<string, React.ComponentType> = {
  "/crm": CRMDashboard,
  "/crm/leads": LeadManagement,
  "/crm/lifecycle": PatientLifecycle,
  "/crm/campaigns": Campaigns,
  "/crm/drip-campaigns": CrmDripCampaigns,
  "/crm/experience": FeedbackSurveys,
  "/crm/reports": CRMAnalytics,
  "/admin/crm": CRMDashboard,
};

function AppRoutes() {
  const { user, logout } = useAuth();
  const { getTabsForRole } = useTenantSettings();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (
    import.meta.env.PROD &&
    isPlatformRuntimeEnabled() &&
    !getPlatformSession()?.accessToken
  ) {
    logout();
    return <Navigate to="/" replace />;
  }

  if (!user.role || !ROLE_TABS[user.role]) {
    console.warn("Invalid role detected, clearing session", user.role);
    logout();
    return <Navigate to="/" replace />;
  }

  const basePath = ROLE_BASE_PATH[user.role] || "/";
  const tabs = getTabsForRole(user.role, { department: user.department, name: user.name }) || [];

  return (
    <Routes>
      <Route path="/" element={<Navigate to={basePath} replace />} />

      {/* Admin routes — fully built */}
      {Object.entries(ADMIN_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            (path === "/admin/platform" || path === "/admin/onboarding") &&
            user.role !== "admin" ? (
              <Navigate to={basePath} replace />
            ) : (
              <AppLayout>
                <Component />
              </AppLayout>
            )
          }
        />
      ))}
      {Object.entries(DOCTOR_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            user.role === "doctor" ? (
              <AppLayout>
                <Component />
              </AppLayout>
            ) : (
              <Navigate to={basePath} replace />
            )
          }
        />
      ))}
      {Object.entries(JR_DOCTOR_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            user.role === "jr_doctor" ? (
              <AppLayout>
                <Component />
              </AppLayout>
            ) : (
              <Navigate to={basePath} replace />
            )
          }
        />
      ))}
      <Route
        path="/doctor/patients/:patientId"
        element={
          user.role === "doctor" ? (
            <AppLayout>
              <DoctorPatientProfile />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />
      <Route
        path="/jr-doctor/patients/:patientId"
        element={
          user.role === "jr_doctor" ? (
            <AppLayout>
              <DoctorPatientProfile />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />
      <Route
        path="/doctor/emr/:patientId"
        element={
          user.role === "doctor" ? (
            <AppLayout>
              <DoctorEMRPatient />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />
      <Route
        path="/doctor/ipd/:patientId"
        element={
          user.role === "doctor" ? (
            <AppLayout>
              <DoctorIPDPatientProfile />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />
      <Route
        path="/doctor/consultation/:patientId"
        element={
          user.role === "doctor" ? (
            <AppLayout>
              <DoctorConsultation />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />
      <Route
        path="/jr-doctor/consultation/:patientId"
        element={
          user.role === "jr_doctor" ? (
            <AppLayout>
              <DoctorConsultation />
            </AppLayout>
          ) : (
            <Navigate to={basePath} replace />
          )
        }
      />

      {/* Nurse routes — fully built */}
      {Object.entries(NURSE_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}
      <Route
        path="/nurse/vitals/chart/:admissionId"
        element={
          <AppLayout>
            <NurseVitalsChart />
          </AppLayout>
        }
      />
      <Route
        path="/nurse/notes/:admissionId"
        element={
          <AppLayout>
            <NurseNotesEditor />
          </AppLayout>
        }
      />

      {/* Reception routes — fully built */}
      {Object.entries(RECEPTION_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}
      <Route
        path="/reception/drip-marketing"
        element={<Navigate to="/crm/drip-campaigns" replace />}
      />

      {/* Lab routes — fully built */}
      {Object.entries(LAB_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Blood Bank routes */}
      {Object.entries(BLOOD_BANK_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Pharmacy routes — fully built */}
      {Object.entries(PHARMACY_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Radiology routes — fully built */}
      {Object.entries(RADIOLOGY_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Billing routes — fully built */}
      {Object.entries(BILLING_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* OT routes — fully built */}
      {Object.entries(OT_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Inventory routes — fully built */}
      {Object.entries(INVENTORY_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Emergency routes — fully built */}
      {Object.entries(EMERGENCY_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      <Route
        path="/admin/staff"
        element={
          <AppLayout>
            <AdminStaffRoute />
          </AppLayout>
        }
      />

      {/* HR routes — fully built */}
      {Object.entries(HR_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Scheduling routes — fully built */}
      {Object.entries(SCHEDULING_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Dialysis routes — fully built */}
      {Object.entries(DIALYSIS_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* CRM routes — fully built */}
      {Object.entries(CRM_PAGES).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout>
              <Component />
            </AppLayout>
          }
        />
      ))}

      {/* Dashboard route for other roles */}
      {user.role !== "doctor" &&
        user.role !== "jr_doctor" &&
        user.role !== "receptionist" &&
        user.role !== "nurse" &&
        user.role !== "lab_technician" &&
        user.role !== "pharmacist" &&
        user.role !== "radiologist" &&
        user.role !== "billing" &&
        user.role !== "admin" &&
        user.role !== "ot_coordinator" &&
        user.role !== "inventory_manager" &&
        user.role !== "emergency" &&
        user.role !== "hr_manager" &&
        user.role !== "scheduler" &&
        user.role !== "dialysis_tech" &&
        user.role !== "crm_manager" && (
          <Route
            path={basePath}
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />
        )}

      {/* All other role tabs as placeholders */}
      {tabs
        .filter((t) => t.key !== "dashboard")
        .filter(
          (t) =>
            !ADMIN_PAGES[t.path] &&
            !DOCTOR_PAGES[t.path] &&
            !RECEPTION_PAGES[t.path] &&
            !NURSE_PAGES[t.path] &&
            !LAB_PAGES[t.path] &&
            !BLOOD_BANK_PAGES[t.path] &&
            !PHARMACY_PAGES[t.path] &&
            !RADIOLOGY_PAGES[t.path] &&
            !BILLING_PAGES[t.path] &&
            !OT_PAGES[t.path] &&
            !INVENTORY_PAGES[t.path] &&
            !EMERGENCY_PAGES[t.path] &&
            !HR_PAGES[t.path] &&
            !SCHEDULING_PAGES[t.path] &&
            !DIALYSIS_PAGES[t.path] &&
            !CRM_PAGES[t.path],
        )
        .map((tab) => (
          <Route
            key={tab.key}
            path={tab.path}
            element={
              <AppLayout>
                <RolePlaceholder title={tab.label} />
              </AppLayout>
            }
          />
        ))}

      {/* Legacy routes */}
      <Route path="/dashboard" element={<Navigate to={basePath} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantSettingsProvider>
        <AuthProvider>
          <HospitalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </HospitalProvider>
        </AuthProvider>
      </TenantSettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
