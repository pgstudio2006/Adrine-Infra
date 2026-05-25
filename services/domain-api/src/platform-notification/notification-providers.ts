export type NotificationProviderResult = {
  provider: string;
  status: 'sent' | 'failed';
  detail?: string;
};

export interface NotificationProvider {
  readonly name: string;
  send(input: {
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
  }): Promise<NotificationProviderResult>;
}

export class ConsoleNotificationProvider implements NotificationProvider {
  readonly name = 'console';

  async send(input: {
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
  }): Promise<NotificationProviderResult> {
    console.info('[notification]', input.channel, input.recipient, input.subject ?? '', input.body);
    return { provider: this.name, status: 'sent', detail: 'logged to console' };
  }
}
