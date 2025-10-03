import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { WaterQualityService } from './water-quality.service';
import { CreateWaterQualityReadingDto } from './dto/create-water-quality-reading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiPaginatedResponse } from '../common/pagination/pagination.decorator';
import { ApiExtraModels } from '@nestjs/swagger';
import { WaterQualityReading } from './entities/water-quality-reading.entity';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';

@ApiExtraModels(WaterQualityReading)
@Controller('water-quality')
export class WaterQualityController {
  constructor(private readonly waterQualityService: WaterQualityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Permissions('water-quality.create')
  @ApiStandardErrorResponses()
  create(@Body(new ValidationPipe()) createDto: CreateWaterQualityReadingDto, @Request() req) {
    // ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ù…Ø³Ø¬Ù„ Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…ØµØ§Ø¯Ù‚ Ø¹Ù„ÙŠÙ‡
    createDto.recordedById = req.user.id;
    return this.waterQualityService.create(createDto, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiPaginatedResponse(WaterQualityReading, {
    description: 'List water quality readings (paginated)',
  })
  @Permissions('water-quality.read')
  @ApiStandardErrorResponses()
  findAll(
    @Request() req,
    @Query('pondId') pondId?: string,
    @Query('page') pageQ?: string,
    @Query('limit') limitQ?: string,
  ) {
    const page = pageQ ? parseInt(pageQ, 10) || 1 : 1;
    const limit = limitQ ? Math.min(parseInt(limitQ, 10) || 25, 100) : 25;
    return this.waterQualityService.findAll(req.tenantId, pondId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trends/:pondId')
  @Permissions('water-quality.read')
  @ApiStandardErrorResponses()
  getWaterQualityTrends(
    @Request() req,
    @Param('pondId') pondId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.waterQualityService.getWaterQualityTrends(req.tenantId, pondId, daysNum);
  }

  // NOTE: Specific route placed BEFORE parameterized ':id' route to avoid shadowing.
  // Endpoint ØªØ¬Ø±ÙŠØ¨ÙŠ Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø± (mock data for UI prototyping)
  @Get('test/mock')
  getMockReadings() {
    return {
      message: 'Ù‚Ø±Ø§Ø¡Ø§Øª Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©',
      data: this.waterQualityService.createMockReadings(),
      parameters: {
        temperature: 'Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© (Â°C)',
        ph: 'Ø§Ù„Ø­Ù…ÙˆØ¶Ø©',
        dissolvedOxygen: 'Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ø§Ù„Ù…Ø°Ø§Ø¨ (mg/L)',
        ammonia: 'Ø§Ù„Ø£Ù…ÙˆÙ†ÙŠØ§ (mg/L)',
        nitrite: 'Ø§Ù„Ù†ØªØ±ÙŠØª (mg/L)',
        nitrate: 'Ø§Ù„Ù†ØªØ±Ø§Øª (mg/L)',
        salinity: 'Ø§Ù„Ù…Ù„ÙˆØ­Ø© (ppt)',
        turbidity: 'Ø§Ù„Ø¹ÙƒØ§Ø±Ø© (NTU)',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @Permissions('water-quality.read')
  @ApiStandardErrorResponses()
  findOne(@Request() req, @Param('id') id: string) {
    return this.waterQualityService.findOne(id, req.tenantId);
  }
}
