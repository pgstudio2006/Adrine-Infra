import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

function base32Encode(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function totp(secret: string, step = 30): string {
  const counter = Math.floor(Date.now() / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', Buffer.from(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(userId: string, tenantId: string) {
    const secret = base32Encode(randomBytes(20));
    const row = await this.prisma.mfaChallenge.create({
      data: { userId, tenantId, secret },
    });
    return {
      challengeId: row.id,
      secret,
      otpauthUrl: `otpauth://totp/Adrine:${userId}?secret=${secret}&issuer=Adrine`,
    };
  }

  async verify(challengeId: string, code: string) {
    const row = await this.prisma.mfaChallenge.findUnique({ where: { id: challengeId } });
    if (!row) throw new BadRequestException('Unknown MFA challenge');
    const expected = totp(row.secret);
    const window = [expected, totp(row.secret, 30)];
    if (!window.includes(code)) throw new BadRequestException('Invalid TOTP code');
    await this.prisma.mfaChallenge.update({
      where: { id: challengeId },
      data: { verified: true },
    });
    return { verified: true };
  }
}
