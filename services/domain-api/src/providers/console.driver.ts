import { Logger } from '@nestjs/common';
import type { ProviderDeliveryInput, ProviderDeliveryResult, ProviderDriver } from './provider-driver.interface';

export class ConsoleDriver implements ProviderDriver {
  readonly id = 'console';
  private readonly logger = new Logger(ConsoleDriver.name);

  async send(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    this.logger.log(
      JSON.stringify({
        provider: this.id,
        channel: input.channel,
        recipient: input.recipient,
        subject: input.subject,
        bodyPreview: input.body.slice(0, 120),
      }),
    );
    return { ok: true, providerId: this.id, externalId: `console-${Date.now()}` };
  }
}
