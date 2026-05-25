import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';

/** MVP in-memory pub/sub per tenant+branch; optional REDIS_URL for future scale-out. */
@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly emitters = new Map<string, EventEmitter>();
  private redisClient: { publish: (ch: string, msg: string) => Promise<void> } | null = null;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.logger.log('REDIS_URL set — realtime will attempt Redis pub/sub when client wired');
    }
  }

  channelKey(tenantId: string, branchId: string): string {
    return `${tenantId}:${branchId}`;
  }

  private emitterFor(channel: string): EventEmitter {
    let em = this.emitters.get(channel);
    if (!em) {
      em = new EventEmitter();
      em.setMaxListeners(100);
      this.emitters.set(channel, em);
    }
    return em;
  }

  emit(channel: string, payload: Record<string, unknown>): void {
    const message = JSON.stringify({ ...payload, at: new Date().toISOString() });
    this.emitterFor(channel).emit('message', message);
    if (this.redisClient) {
      void this.redisClient.publish(`adrine:rt:${channel}`, message).catch((e) => {
        this.logger.warn(`Redis publish failed: ${e}`);
      });
    }
  }

  subscribe(channel: string, listener: (data: string) => void): () => void {
    const em = this.emitterFor(channel);
    em.on('message', listener);
    return () => em.off('message', listener);
  }

  onModuleDestroy(): void {
    for (const em of this.emitters.values()) em.removeAllListeners();
    this.emitters.clear();
  }
}
