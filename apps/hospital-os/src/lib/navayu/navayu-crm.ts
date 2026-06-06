import { canUseCrmRuntime, platformCreateCrmLead } from '@/runtime/crm-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { referralLabel, type NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';

export async function maybeCreateNavayuCrmLead(input: {
  fullName: string;
  phone?: string;
  platformPatientId?: string;
  opdVisitId?: string;
  metadata: NavayuRegistrationMetadata;
}): Promise<void> {
  if (!input.metadata.hearAboutNavayu || !canUseCrmRuntime()) {
    return;
  }

  const channel = referralLabel(input.metadata.hearAboutNavayu);
  const regions = input.metadata.bodyRegions.join(', ');
  const branchId = getPlatformSession()?.branchId;

  try {
    await platformCreateCrmLead(
      {
        fullName: input.fullName,
        phone: input.phone,
        patientId: input.platformPatientId,
        opdVisitId: input.opdVisitId,
        channel,
        specialty: 'MSK',
        stage: 'new_inquiry',
        notes: [
          `Referral: ${channel}`,
          regions ? `Pain regions: ${regions}` : null,
          input.opdVisitId ? `Visit: ${input.opdVisitId}` : null,
          `Reception → CRM handoff`,
        ]
          .filter(Boolean)
          .join(' · '),
      },
      branchId,
    );
  } catch {
    /* CRM is best-effort — registration still succeeds */
  }
}
