import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { WaterQualityService } from '../water-quality/water-quality.service';
import { CreateWaterQualityReadingDto } from '../water-quality/dto/create-water-quality-reading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';

function verifyHmacSignature(
  secret: string,
  rawBody: string,
  provided: string | undefined,
): boolean {
  if (!provided) return false;
  const hmac = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(provided));
  } catch {
    return false;
  }
}

@ApiTags('IoT')
@Controller('iot')
export class IotController {
  constructor(
    private readonly cfg: ConfigService,
    private readonly waterQuality: WaterQualityService,
  ) {}

  // Public HMAC-secured endpoint for device ingestion
  @Post('ingest')
  @ApiOperation({
    summary: 'Ingest water quality data from IoT devices',
    description:
      'HMAC-secured endpoint for IoT devices to submit water quality readings. Requires X-Signature header with HMAC-SHA256 of request body.',
  })
  @ApiHeader({
    name: 'X-Signature',
    description: 'HMAC-SHA256 signature of request body using IOT_SHARED_SECRET',
    required: true,
  })
  @ApiHeader({
    name: 'X-Tenant-Id',
    description: 'Tenant identifier for data isolation',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Water quality reading created successfully',
    type: 'object',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature or missing tenant context',
  })
  @ApiStandardErrorResponses()
  async ingest(
    @Headers('x-signature') signature: string,
    @Headers('x-tenant-id') headerTenant: string,
    @Body(new ValidationPipe()) dto: CreateWaterQualityReadingDto,
    @Req() req: any,
  ) {
    const secret = this.cfg.get<string>('IOT_SHARED_SECRET');
    if (!secret) {
      throw new UnauthorizedException('IoT ingestion not configured');
    }
    // Note: to verify HMAC we need the raw body string; fallback to JSON stringify if not provided by body parser
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(dto);
    const ok = verifyHmacSignature(secret, raw, signature);
    if (!ok) {
      throw new UnauthorizedException('Invalid signature');
    }
    const tenantId = req.tenantId || headerTenant;
    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }
    // Mark as sensor origin by default
    dto.readingMethod = dto.readingMethod || 'sensor';
    return this.waterQuality.create(dto, tenantId);
  }

  // Optional: Authenticated variant (when devices authenticate via JWT proxy)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('ingest/auth')
  @ApiBearerAuth()
  @Permissions('water-quality.create')
  @ApiOperation({
    summary: 'Ingest water quality data (JWT authenticated)',
    description:
      'Alternative endpoint for authenticated devices using JWT tokens instead of HMAC signatures.',
  })
  @ApiResponse({
    status: 201,
    description: 'Water quality reading created successfully',
    type: 'object',
  })
  @ApiStandardErrorResponses()
  async ingestAuth(@Body(new ValidationPipe()) dto: CreateWaterQualityReadingDto, @Req() req: any) {
    dto.readingMethod = dto.readingMethod || 'sensor';
    return this.waterQuality.create(dto, req.tenantId);
  }
}
