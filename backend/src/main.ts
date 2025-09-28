import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MetricsService } from './observability/metrics.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/logging/request-logger.middleware';
import { PinoLoggerService } from './common/logging/pino-logger.service';
import { PaginationInterceptor } from './common/pagination/pagination.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Middlewares (order matters: correlation id first)
  const pino = app.get(PinoLoggerService);
  app.use(new CorrelationIdMiddleware().use);
  // Create a single instance of the request logger middleware
  const reqLogger = new RequestLoggerMiddleware(pino);
  app.use(reqLogger.use.bind(reqLogger));
  // Global error filter
  const metrics = app.get(MetricsService);
  app.useGlobalFilters(new GlobalExceptionFilter(pino as any, metrics));
  // Global pagination interceptor (idempotent wrapping for list responses)
  app.useGlobalInterceptors(new PaginationInterceptor());

  // Swagger (development / staging only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AquaFarm Pro API')
      .setDescription(
        'MVP endpoints for authentication, tenants, farms, ponds.\nMulti-tenancy header: X-Tenant-Id: <tenant-code-or-uuid>. This header is injected globally in the Swagger UI for convenience.',
      )
      .setVersion('0.1.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);

    // Inject a reusable global header parameter for multi-tenancy if not already present
    document.components ||= {};
    document.components.parameters ||= {};
    if (!document.components.parameters['XTenantIdHeader']) {
      document.components.parameters['XTenantIdHeader'] = {
        name: 'X-Tenant-Id',
        in: 'header',
        required: false,
        description:
          'Tenant code or UUID for scoping requests (set TENANT_STRICT=true to require on protected routes).',
        schema: { type: 'string', example: 'default' },
      } as any; // Swagger types may differ at runtime; cast to any for mutation safety
    }

    // Attach the header reference to every path & method (skip if already present)
    for (const pathKey of Object.keys(document.paths)) {
      const pathItem: any = (document.paths as any)[pathKey];
      for (const method of Object.keys(pathItem)) {
        const operationObject = pathItem[method];
        if (!operationObject || typeof operationObject !== 'object') continue;
        operationObject.parameters = operationObject.parameters || [];
        const already = operationObject.parameters.some(
          (p: any) => p.name === 'X-Tenant-Id' || p['$ref']?.endsWith('XTenantIdHeader'),
        );
        if (!already) {
          operationObject.parameters.push({ $ref: '#/components/parameters/XTenantIdHeader' });
        }
      }
    }
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    pino.info({ event: 'swagger.enabled', path: '/docs' }, 'Swagger UI enabled');
  }

  // Metrics request counter (middleware) if module loaded
  if (metrics) {
    app.use((req, res, next) => {
      res.on('finish', () => {
        try {
          metrics.incRequest(req.method, res.statusCode);
        } catch {
          /* swallow */
        }
      });
      next();
    });
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📘 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
