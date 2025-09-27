import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { DummyErrorController } from '../src/test-support/dummy-error.controller';
import { PinoLoggerService } from '../src/common/logging/pino-logger.service';
import { ErrorCode } from '../src/common/errors/error-codes.enum';

// Lightweight E2E module that augments AppModule with the dummy controller

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [DummyErrorController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const pino = app.get(PinoLoggerService);
    app.useGlobalFilters(new GlobalExceptionFilter(pino));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns explicit code when provided', async () => {
    const res = await request(app.getHttpServer()).get('/dummy-error/explicit');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(ErrorCode.POND_NOT_FOUND);
    expect(res.body.message).toContain('Explicit pond missing');
  });

  it('maps implicit 404 to NOT_FOUND code', async () => {
    const res = await request(app.getHttpServer()).get('/dummy-error/implicit404');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('maps bad request to VALIDATION_ERROR code', async () => {
    const res = await request(app.getHttpServer()).get('/dummy-error/badrequest');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('maps generic error to INTERNAL_ERROR', async () => {
    const res = await request(app.getHttpServer()).get('/dummy-error/boom');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
