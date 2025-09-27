import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PaginationInterceptor } from '../src/common/pagination/pagination.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PinoLoggerService } from '../src/common/logging/pino-logger.service';

// Creates an application instance mirroring main.ts bootstrap logic for e2e tests.
export async function bootstrapTestApp(moduleFixture: TestingModule): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  let pino: PinoLoggerService | undefined;
  try {
    pino = app.get(PinoLoggerService);
  } catch {}
  app.useGlobalFilters(new GlobalExceptionFilter(pino as any));
  app.useGlobalInterceptors(new PaginationInterceptor());

  const config = new DocumentBuilder()
    .setTitle('AquaFarm Pro API')
    .setDescription(
      'MVP endpoints for authentication, tenants, farms, ponds.\nMulti-tenancy header: X-Tenant-Id: <tenant-code-or-uuid>.',
    )
    .setVersion('0.1.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.components ||= {};
  (document.components as any).parameters ||= {};
  if (!(document.components as any).parameters['XTenantIdHeader']) {
    (document.components as any).parameters['XTenantIdHeader'] = {
      name: 'X-Tenant-Id',
      in: 'header',
      required: false,
      description: 'Tenant code or UUID for scoping requests.',
      schema: { type: 'string', example: 'default' },
    };
  }

  for (const pathKey of Object.keys(document.paths)) {
    const pathItem: any = (document.paths as any)[pathKey];
    for (const method of Object.keys(pathItem)) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      op.parameters = op.parameters || [];
      const already = op.parameters.some(
        (p: any) => p.name === 'X-Tenant-Id' || p['$ref']?.endsWith('XTenantIdHeader'),
      );
      if (!already) op.parameters.push({ $ref: '#/components/parameters/XTenantIdHeader' });
    }
  }

  SwaggerModule.setup('docs', app, document, { swaggerOptions: { persistAuthorization: true } });

  await app.init();
  return app;
}
