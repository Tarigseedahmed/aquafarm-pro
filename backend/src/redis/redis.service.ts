import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

type MessageHandler = (payload: any) => void;

@Injectable()
export class RedisService {
  private client: RedisClientType | null = null; // publisher / commands
  private subClient: RedisClientType | null = null; // dedicated subscriber
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly config: ConfigService) {}

  async connect() {
    if (this.client) return;
    if (process.env.NODE_ENV === 'test' && process.env.REDIS_TEST_ENABLE !== 'true') {
      return; // keep disabled in tests unless explicitly enabled
    }
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = createClient({ url });
    this.client.on('error', (err) => this.logger.error('Redis error', err as any));
    this.client.on('connect', () => this.logger.log('Redis connected'));
    try {
      await this.client.connect();
    } catch (e) {
      this.logger.warn(`Redis connection failed: ${(e as Error).message}`);
      this.client = null; // fallback to null (graceful degradation)
    }
  }

  async disconnect() {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      this.logger.warn('Redis quit error');
    }
    this.client = null;
    if (this.subClient) {
      try {
        await this.subClient.quit();
      } catch {
        this.logger.warn('Redis subscriber quit error');
      }
      this.subClient = null;
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async incr(key: string): Promise<number | null> {
    if (!this.client) return null;
    return this.client.incr(key);
  }

  async publish(channel: string, message: any): Promise<void> {
    if (!this.client) return;
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: MessageHandler) {
    if (!this.client) return; // not enabled
    if (!this.subClient) {
      this.subClient = createClient({ url: (this.client as any).options?.url });
      this.subClient.on('error', (err) => this.logger.error('Redis sub error', err as any));
      try {
        await this.subClient.connect();
      } catch (e) {
        this.logger.warn(`Redis subscriber connect failed: ${(e as Error).message}`);
        this.subClient = null;
        return;
      }
    }
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      await this.subClient.subscribe(channel, (raw) => {
        let parsed: any = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {}
        const set = this.subscriptions.get(channel);
        if (set) {
          for (const h of set) {
            try {
              h(parsed);
            } catch (err) {
              this.logger.warn(`Redis handler error: ${(err as Error).message}`);
            }
          }
        }
      });
    }
    this.subscriptions.get(channel)!.add(handler);
  }
}
