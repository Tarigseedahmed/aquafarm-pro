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
import { SecurityConfigService } from './common/config/security.config';
import helmet from 'helmet';
import * as express from 'express';
import cors from 'cors';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

async function bootstrap() {
  // Enforce UTC timezone across the application runtime
  if (!process.env.TZ) {
    process.env.TZ = 'UTC';
  }
  const app = await NestFactory.create(AppModule);
  
  // Get security configuration
  const securityConfig = app.get(SecurityConfigService);
  const config = securityConfig.getSecurityConfig();
  
  // Apply security headers
  app.use(helmet({
    contentSecurityPolicy: config.helmet.contentSecurityPolicy ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : false,
    hsts: config.helmet.hsts ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  }));
  
  // Body size limits
  app.use(express.json({ limit: process.env.BODY_LIMIT || '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '1mb' }));
  
  // CORS configuration
  app.enableCors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });
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
  // Request context (after user is potentially attached by auth guards later, still sets tenantId early)
  app.use(new RequestContextMiddleware().use);
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
      // High-resolution start time for latency measurement (shared with exception filter if needed)
      (req as any)._metricsStart = process.hrtime();
      res.on('finish', () => {
        try {
          metrics.incRequest(req.method, res.statusCode);
          // Observe duration for all responses (2xx-5xx). Histogram method will also increment 5xx counter internally.
          const diff = process.hrtime((req as any)._metricsStart || process.hrtime());
          const seconds = diff[0] + diff[1] / 1e9;
          try {
            metrics.observeRequestDuration(
              req.method,
              // Prefer the matched route path to reduce cardinality; fallback to originalUrl
              req.route?.path || req.originalUrl || 'unknown',
              res.statusCode,
              seconds,
            );
          } catch {
            /* swallow metric errors */
          }
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
