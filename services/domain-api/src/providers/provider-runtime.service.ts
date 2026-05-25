import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleDriver } from './console.driver';
import { SendGridEmailDriver } from './sendgrid-email.driver';
import { TwilioSmsDriver } from './twilio-sms.driver';
import type { ProviderDeliveryInput, ProviderDeliveryResult, ProviderDriver } from './provider-driver.interface';

@Injectable()
export class ProviderRuntimeService {
  private readonly smsDrivers: ProviderDriver[];
  private readonly emailDrivers: ProviderDriver[];

  constructor(config: ConfigService) {
    const console = new ConsoleDriver();
    this.smsDrivers = [console];
    this.emailDrivers = [console];

    const twilioSid = config.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = config.get<string>('TWILIO_AUTH_TOKEN');
    const twilioFrom = config.get<string>('TWILIO_FROM_NUMBER');
    if (twilioSid && twilioToken && twilioFrom) {
      this.smsDrivers.unshift(new TwilioSmsDriver(twilioSid, twilioToken, twilioFrom));
    }

    const sgKey = config.get<string>('SENDGRID_API_KEY');
    const sgFrom = config.get<string>('SENDGRID_FROM_EMAIL');
    if (sgKey && sgFrom) {
      this.emailDrivers.unshift(new SendGridEmailDriver(sgKey, sgFrom));
    }
  }

  async deliver(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    const chain = input.channel === 'sms' ? this.smsDrivers : this.emailDrivers;
    for (const driver of chain) {
      const result = await driver.send(input);
      if (result.ok) return result;
    }
    return { ok: false, providerId: 'none', error: 'All providers failed' };
  }
}
