import { canUseCrmRuntime, platformCreateCrmLead } from '@/runtime/crm-runtime';
import { referralLabel, type NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';

export async function maybeCreateNavayuCrmLead(input: {
  fullName: string;
  phone?: string;
  platformPatientId?: string;
  metadata: NavayuRegistrationMetadata;
}): Promise<void> {
  if (!input.metadata.hearAboutNavayu || !canUseCrmRuntime()) {
    return;
  }

  const channel = referralLabel(input.metadata.hearAboutNavayu);
  const regions = input.metadata.bodyRegions.join(', ');

  try {
    await platformCreateCrmLead({
      fullName: input.fullName,
      phone: input.phone,
      patientId: input.platformPatientId,
      channel,
      specialty: 'MSK',
      stage: 'new_inquiry',
      notes: [
        `Referral: ${channel}`,
        regions ? `Pain regions: ${regions}` : null,
        `Navayu UAT v0 auto-lead from reception`,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  } catch {
    /* CRM is best-effort for UAT v0 — registration still succeeds */
  }
}
