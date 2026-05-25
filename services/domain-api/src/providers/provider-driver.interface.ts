export type ProviderDeliveryInput = {
  channel: 'sms' | 'email';
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type ProviderDeliveryResult = {
  ok: boolean;
  providerId: string;
  externalId?: string;
  error?: string;
};

/** Pluggable notification/payment drivers — env: TWILIO_*, SENDGRID_*, RAZORPAY_* */
export interface ProviderDriver {
  readonly id: string;
  send(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult>;
}
