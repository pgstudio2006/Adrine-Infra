import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "@/components/candela-app/AppShell";
import { CommandCenterBriefing } from "@/components/candela-app/patterns";
import RisPatientSearch from "@/pages/ris/RisPatientSearch";
import RisNewPatient from "@/pages/ris/RisNewPatient";
import RisOrderCreation from "@/pages/ris/RisOrderCreation";
import RisBilling from "@/pages/ris/RisBilling";
import RisScheduler from "@/pages/ris/RisScheduler";
import RisTechWorklist from "@/pages/ris/RisTechWorklist";
import RisStudyExecution from "@/pages/ris/RisStudyExecution";
import RisPacsViewer from "@/pages/ris/RisPacsViewer";
import RisRadiologistQueue from "@/pages/ris/RisRadiologistQueue";
import RisReportingWorkspace from "@/pages/ris/RisReportingWorkspace";
import RisTemplates from "@/pages/ris/RisTemplates";
import RisReportPreview from "@/pages/ris/RisReportPreview";
import RisReportFinalization from "@/pages/ris/RisReportFinalization";
import RisDispatch from "@/pages/ris/RisDispatch";
import RisHistory from "@/pages/ris/RisHistory";
import DiagnosticsLanding from "@/pages/ris/DiagnosticsLanding";
import { WorkspacePlaceholder } from "@/pages/ris/WorkspacePlaceholder";
import RisRevenueAnalytics from "@/pages/ris/RisRevenueAnalytics";
import RisOperationalAnalytics from "@/pages/ris/RisOperationalAnalytics";
import RisMachineUtilization from "@/pages/ris/RisMachineUtilization";
import RisRadiologistPerf from "@/pages/ris/RisRadiologistPerf";
import RisReferralAnalytics from "@/pages/ris/RisReferralAnalytics";
import RisSettings from "@/pages/ris/RisSettings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CommandCenterBriefing />} />
          <Route path="/patients" element={<RisPatientSearch />} />
          <Route path="/patients/new" element={<RisNewPatient />} />
          <Route path="/orders" element={<RisOrderCreation />} />
          <Route path="/diagnostics" element={<DiagnosticsLanding />} />
          <Route path="/clinical" element={<WorkspacePlaceholder workspaceId="clinical" />} />
          <Route path="/operations" element={<WorkspacePlaceholder workspaceId="operations" />} />
          <Route path="/compliance" element={<WorkspacePlaceholder workspaceId="compliance" />} />
          <Route path="/billing" element={<RisBilling />} />
          <Route path="/scheduler" element={<RisScheduler />} />
          <Route path="/worklist" element={<RisTechWorklist />} />
          <Route path="/execution" element={<RisStudyExecution />} />
          <Route path="/pacs" element={<RisPacsViewer />} />
          <Route path="/radiologist-queue" element={<RisRadiologistQueue />} />
          <Route path="/reporting" element={<RisReportingWorkspace />} />
          <Route path="/templates" element={<RisTemplates />} />
          <Route path="/reports" element={<RisReportPreview />} />
          <Route path="/finalize" element={<RisReportFinalization />} />
          <Route path="/dispatch" element={<RisDispatch />} />
          <Route path="/history" element={<RisHistory />} />
          <Route path="/analytics/revenue" element={<RisRevenueAnalytics />} />
          <Route path="/analytics/operational" element={<RisOperationalAnalytics />} />
          <Route path="/analytics/utilization" element={<RisMachineUtilization />} />
          <Route path="/analytics/radiologist" element={<RisRadiologistPerf />} />
          <Route path="/analytics/referrals" element={<RisReferralAnalytics />} />
          <Route path="/settings" element={<RisSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
