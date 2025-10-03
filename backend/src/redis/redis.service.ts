import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MessageHandler = (payload: any) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null; // publisher / commands
  private subClient: Redis | null = null; // dedicated subscriber
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect() {
    if (this.client) return;
    if (process.env.NODE_ENV === 'test' && process.env.REDIS_TEST_ENABLE !== 'true') {
      return; // keep disabled in tests unless explicitly enabled
    }
    
    const redisConfig = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD'),
      db: this.config.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.client = new Redis(redisConfig);
    this.client.on('error', (err) => this.logger.error('Redis error', err));
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('ready', () => this.logger.log('Redis ready'));
    
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

  async incrby(key: string, increment: number): Promise<number | null> {
    if (!this.client) return null;
    return this.client.incrby(key, increment);
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.set(key, value);
  }

  async setex(key: string, ttl: number, value: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.setex(key, ttl, value);
  }

  async del(...keys: string[]): Promise<number | null> {
    if (!this.client) return null;
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean | null> {
    if (!this.client) return null;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<boolean | null> {
    if (!this.client) return null;
    const result = await this.client.expire(key, ttl);
    return result === 1;
  }

  async ttl(key: string): Promise<number | null> {
    if (!this.client) return null;
    return this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[] | null> {
    if (!this.client) return null;
    return this.client.keys(pattern);
  }

  async ping(): Promise<string | null> {
    if (!this.client) return null;
    const result = await this.client.ping();
    return result as string;
  }

  async publish(channel: string, message: any): Promise<void> {
    if (!this.client) return;
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: MessageHandler) {
    if (!this.client) return; // not enabled
    if (!this.subClient) {
      const redisConfig = {
        host: this.config.get<string>('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: this.config.get<string>('REDIS_PASSWORD'),
        db: this.config.get<number>('REDIS_DB', 0),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };
      
      this.subClient = new Redis(redisConfig);
      this.subClient.on('error', (err) => this.logger.error('Redis sub error', err));
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
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (ch, raw) => {
        if (ch === channel) {
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
        }
      });
    }
    this.subscriptions.get(channel)!.add(handler);
  }
}
