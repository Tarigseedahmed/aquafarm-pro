import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Tenant } from '../src/tenancy/entities/tenant.entity';
import { Farm } from '../src/farms/entities/farm.entity';
import { seedBasic } from './helpers/seed';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../src/notifications/notifications.service';
import * as http from 'http';
import { bootstrapTestApp } from './bootstrap-test-app';

describe('Notifications SSE (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await bootstrapTestApp(mod);
    // For raw Node http client SSE test we need an actual listening socket (app.init alone is not enough)
    await app.listen(0); // 0 => ephemeral port
  });

  afterAll(async () => {
    await app.close();
  });

  it('streams notification events over SSE', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users, tenant } = await seedBasic(tenantRepo, userRepo, farmRepo, {
      users: 2,
      farms: 0,
    });
    const me = users[0];
    const jwt = app
      .get(JwtService)
      .sign({ sub: me.id, email: me.email, role: me.role, tenantId: tenant.id });

    const serverAddress = app.getHttpServer().address();
    const port =
      typeof serverAddress === 'object' && serverAddress
        ? serverAddress.port
        : (() => {
            throw new Error('Server not listening');
          })();

    const received: any[] = [];

    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/notifications/stream',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'X-Tenant-Id': tenant.id,
            Accept: 'text/event-stream',
          },
        },
        (res) => {
          res.setEncoding('utf8');
          let buffer = '';
          res.on('data', (chunk) => {
            buffer += chunk;
            // SSE events separated by double newlines
            const parts = buffer.split('\n\n');
            while (parts.length > 1) {
              const rawEvent = parts.shift();
              if (rawEvent) {
                const lines = rawEvent.split('\n');
                let type: string | undefined;
                let dataLine: string | undefined;
                for (const l of lines) {
                  if (l.startsWith('event:')) type = l.slice(6).trim();
                  if (l.startsWith('data:')) dataLine = l.slice(5).trim();
                }
                if (type === 'notification' && dataLine) {
                  try {
                    const parsed = JSON.parse(dataLine);
                    received.push(parsed);
                    resolve();
                    req.destroy();
                    return;
                  } catch (e) {
                    reject(e);
                  }
                }
              }
              buffer = parts.join('\n\n');
            }
          });
          res.on('error', (e) => reject(e));
        },
      );
      req.on('error', (e) => reject(e));
      req.end();
      // After connection established, create a notification
      setTimeout(async () => {
        try {
          const svc = app.get(NotificationsService);
          await svc.create(
            {
              userId: me.id,
              title: 'Test SSE',
              message: 'Hello SSE',
              type: 'info',
              category: 'system',
              priority: 'low',
            },
            tenant.id,
          );
        } catch (err) {
          reject(err);
        }
      }, 100);
      // Timeout safety
      setTimeout(() => reject(new Error('SSE test timeout')), 4000);
    });

    expect(received.length).toBe(1);
    expect(received[0].title).toBe('Test SSE');
    expect(received[0].tenantId).toBe(tenant.id);
    expect(received[0].userId).toBe(me.id);
  });
});
