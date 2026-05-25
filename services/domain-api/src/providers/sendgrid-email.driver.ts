import { Logger } from '@nestjs/common';
import type { ProviderDeliveryInput, ProviderDeliveryResult, ProviderDriver } from './provider-driver.interface';

/** SENDGRID_API_KEY, SENDGRID_FROM_EMAIL */
export class SendGridEmailDriver implements ProviderDriver {
  readonly id = 'sendgrid_email';
  private readonly logger = new Logger(SendGridEmailDriver.name);

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
  ) {}

  async send(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    if (input.channel !== 'email') {
      return { ok: false, providerId: this.id, error: 'SendGrid driver only supports email' };
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: input.recipient }] }],
          from: { email: this.fromEmail },
          subject: input.subject ?? 'Adrine Hospital',
          content: [{ type: 'text/plain', value: input.body }],
        }),
      });
      if (!res.ok) {
        return { ok: false, providerId: this.id, error: await res.text() };
      }
      return { ok: true, providerId: this.id, externalId: res.headers.get('x-message-id') ?? undefined };
    } catch (e) {
      this.logger.warn(`SendGrid send failed: ${e}`);
      return { ok: false, providerId: this.id, error: String(e) };
    }
  }
}
