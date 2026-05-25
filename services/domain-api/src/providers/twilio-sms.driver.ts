import { Logger } from '@nestjs/common';
import type { ProviderDeliveryInput, ProviderDeliveryResult, ProviderDriver } from './provider-driver.interface';

/** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER */
export class TwilioSmsDriver implements ProviderDriver {
  readonly id = 'twilio_sms';
  private readonly logger = new Logger(TwilioSmsDriver.name);

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  async send(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    if (input.channel !== 'sms') {
      return { ok: false, providerId: this.id, error: 'Twilio driver only supports sms' };
    }
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: input.recipient,
        From: this.fromNumber,
        Body: input.body,
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, providerId: this.id, error: text };
      }
      const json = (await res.json()) as { sid?: string };
      return { ok: true, providerId: this.id, externalId: json.sid };
    } catch (e) {
      this.logger.warn(`Twilio send failed: ${e}`);
      return { ok: false, providerId: this.id, error: String(e) };
    }
  }
}
