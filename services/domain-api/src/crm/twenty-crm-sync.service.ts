import { Injectable, Logger } from '@nestjs/common';

type LeadSyncInput = {
  fullName: string;
  phone?: string;
  email?: string;
  channel?: string;
  specialty?: string;
  stage?: string;
  notes?: string;
  opdVisitId?: string;
  patientId?: string;
};

/**
 * Syncs Adrine CRM leads to a self-hosted Twenty workspace via REST API.
 * Configure TWENTY_CRM_URL + TWENTY_API_KEY on domain-api (never in the browser).
 */
@Injectable()
export class TwentyCrmSyncService {
  private readonly logger = new Logger(TwentyCrmSyncService.name);

  private get baseUrl(): string | null {
    const url = process.env.TWENTY_CRM_URL?.trim();
    return url ? url.replace(/\/$/, '') : null;
  }

  private get apiKey(): string | null {
    const key = process.env.TWENTY_API_KEY?.trim();
    return key || null;
  }

  isEnabled(): boolean {
    return Boolean(this.baseUrl && this.apiKey);
  }

  /** Best-effort mirror — never blocks Adrine lead creation */
  async syncLead(input: LeadSyncInput): Promise<void> {
    if (!this.isEnabled()) return;

    const base = this.baseUrl!;
    const key = this.apiKey!;

    const nameParts = input.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? 'Patient';
    const lastName = nameParts.slice(1).join(' ') || 'Lead';

    const personBody: Record<string, unknown> = {
      firstName,
      lastName,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.email ? { email: input.email } : {}),
      jobTitle: input.specialty ? `${input.specialty} inquiry` : 'Hospital lead',
    };

    try {
      const personRes = await fetch(`${base}/rest/people`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personBody),
      });

      if (!personRes.ok) {
        const text = await personRes.text();
        this.logger.warn(`Twenty person create failed (${personRes.status}): ${text.slice(0, 200)}`);
        return;
      }

      const personJson = (await personRes.json()) as { data?: { id?: string } };
      const personId = personJson.data?.id;

      const opportunityName = `${input.fullName} — ${input.channel ?? 'Inquiry'}`;
      const oppBody: Record<string, unknown> = {
        name: opportunityName,
        ...(personId ? { pointOfContact: { connect: personId } } : {}),
      };

      const oppRes = await fetch(`${base}/rest/opportunities`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(oppBody),
      });

      if (!oppRes.ok) {
        const text = await oppRes.text();
        this.logger.warn(`Twenty opportunity create failed (${oppRes.status}): ${text.slice(0, 200)}`);
        return;
      }

      this.logger.log(`Twenty sync OK for lead ${input.fullName} (visit ${input.opdVisitId ?? 'n/a'})`);
    } catch (error) {
      this.logger.warn(`Twenty sync error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
