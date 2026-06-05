import { ConnectedOpsPage } from '@/components/platform/ConnectedOpsPage';

export default function PharmacyQueries() {
  return (
    <ConnectedOpsPage
      title="Doctor & Nurse Queries"
      description="Inter-department medication query stream driven by live clinical workflow events."
      focus="query"
    />
  );
}
