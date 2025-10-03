import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WaterQualityReading } from './entities/water-quality-reading.entity';
import { CreateWaterQualityReadingDto } from './dto/create-water-quality-reading.dto';
import { AlertEngineService } from '../alerts/alert-engine.service';

@Injectable()
export class WaterQualityService {
  constructor(
    @InjectRepository(WaterQualityReading)
    private waterQualityRepository: Repository<WaterQualityReading>,
    @Inject(forwardRef(() => AlertEngineService))
    private alertEngineService: AlertEngineService,
  ) {}

  async create(
    createDto: CreateWaterQualityReadingDto,
    tenantId: string,
  ): Promise<WaterQualityReading> {
    // ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ù‚ÙŠÙ…
    const alerts = this.analyzeWaterQuality(createDto);
    const status = alerts.length > 0 ? 'warning' : 'normal';

    const reading = this.waterQualityRepository.create({
      ...createDto,
      alerts,
      status,
      tenantId,
    });

    const savedReading = await this.waterQualityRepository.save(reading);

    // Process alerts using the new alert engine
    try {
      await this.alertEngineService.processWaterQualityReading(savedReading);
    } catch (error) {
      // Log error but don't fail the water quality reading creation
      console.error('Error processing alerts:', error);
    }

    return savedReading;
  }

  async findAll(
    tenantId: string,
    pondId?: string,
    page = 1,
    limit = 25,
  ): Promise<{ items: WaterQualityReading[]; total: number }> {
    const query = this.waterQualityRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.pond', 'pond')
      .leftJoinAndSelect('reading.recordedBy', 'user')
      .where('reading.tenantId = :tenantId', { tenantId });

    if (pondId) {
      query.andWhere('reading.pondId = :pondId', { pondId });
    }

    query
      .orderBy('reading.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, tenantId: string): Promise<WaterQualityReading> {
    const reading = await this.waterQualityRepository.findOne({
      where: { id, tenantId },
      relations: ['pond', 'recordedBy'],
    });

    if (!reading) {
      throw new NotFoundException({
        message: 'Water quality reading not found',
        code: ErrorCode.WATER_READING_NOT_FOUND,
      });
    }

    return reading;
  }

  // ØªØ­Ù„ÙŠÙ„ Ø§ØªØ¬Ø§Ù‡Ø§Øª Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡
  async getWaterQualityTrends(tenantId: string, pondId: string, days = 7): Promise<any> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const readings = await this.waterQualityRepository.find({
      where: {
        pondId,
        tenantId,
        createdAt: Between(fromDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    return {
      pondId,
      period: `${days} days`,
      totalReadings: readings.length,
      trends: {
        temperature: this.calculateTrend(readings, 'temperature'),
        ph: this.calculateTrend(readings, 'ph'),
        dissolvedOxygen: this.calculateTrend(readings, 'dissolvedOxygen'),
        ammonia: this.calculateTrend(readings, 'ammonia'),
      },
      alerts: readings.filter((r) => r.alerts && r.alerts.length > 0).length,
      readings: readings,
    };
  }

  // ØªØ­Ù„ÙŠÙ„ Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡ ÙˆØ¥Ù†Ø´Ø§Ø¡ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª
  private analyzeWaterQuality(data: CreateWaterQualityReadingDto): string[] {
    const alerts: string[] = [];

    // Ù†Ø·Ø§Ù‚Ø§Øª Ù…Ù‚Ø¨ÙˆÙ„Ø© Ù„Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡ (ÙŠÙ…ÙƒÙ† ØªØ®ØµÙŠØµÙ‡Ø§ Ø­Ø³Ø¨ Ù†ÙˆØ¹ Ø§Ù„Ø³Ù…Ùƒ)
    if (data.temperature > 30 || data.temperature < 18) {
      alerts.push('temperature_out_of_range');
    }

    if (data.ph > 8.5 || data.ph < 6.5) {
      alerts.push('ph_out_of_range');
    }

    if (data.dissolvedOxygen < 5.0) {
      alerts.push('low_dissolved_oxygen');
    }

    if (data.ammonia > 1.0) {
      alerts.push('high_ammonia');
    }

    if (data.nitrite > 0.5) {
      alerts.push('high_nitrite');
    }

    if (data.nitrate > 40) {
      alerts.push('high_nitrate');
    }

    return alerts;
  }

  // Ø­Ø³Ø§Ø¨ Ø§Ù„Ø§ØªØ¬Ø§Ù‡ (trend) Ù„Ù„Ù‚ÙŠÙ…
  private calculateTrend(readings: WaterQualityReading[], parameter: string): any {
    if (readings.length < 2) return { trend: 'stable', change: 0 };

    const values = readings.map((r) => r[parameter]).filter((v) => v !== null && v !== undefined);
    if (values.length < 2) return { trend: 'stable', change: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    let trend = 'stable';
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';

    return {
      trend,
      change: Math.round(change * 100) / 100,
      current: last,
      previous: first,
      min: Math.min(...values),
      max: Math.max(...values),
      average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
    };
  }

  // Ø¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø±
  async createMockReadings(): Promise<any[]> {
    const mockReadings = [
      {
        id: '1',
        temperature: 24.5,
        ph: 7.2,
        dissolvedOxygen: 6.8,
        ammonia: 0.2,
        nitrite: 0.1,
        nitrate: 15,
        salinity: 35,
        turbidity: 2.1,
        readingMethod: 'sensor',
        status: 'normal',
        alerts: [],
        pondId: '1',
        pond: { name: 'Ø­ÙˆØ¶ Ø§Ù„Ù‡Ø§Ù…ÙˆØ± Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ' },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        temperature: 26.0,
        ph: 7.8,
        dissolvedOxygen: 5.2,
        ammonia: 0.8,
        nitrite: 0.3,
        nitrate: 25,
        readingMethod: 'manual',
        status: 'warning',
        alerts: ['high_ammonia'],
        pondId: '2',
        pond: { name: 'Ø­ÙˆØ¶ Ø§Ù„Ø¨Ù„Ø·ÙŠ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠ' },
        createdAt: new Date(Date.now() - 3600000).toISOString(), // Ù…Ù†Ø° Ø³Ø§Ø¹Ø©
      },
      {
        id: '3',
        temperature: 22.0,
        ph: 6.9,
        dissolvedOxygen: 7.5,
        ammonia: 0.1,
        nitrite: 0.05,
        nitrate: 10,
        readingMethod: 'sensor',
        status: 'normal',
        alerts: [],
        pondId: '3',
        pond: { name: 'Ø­ÙˆØ¶ Ø§Ù„Ø­Ø¶Ø§Ù†Ø©' },
        createdAt: new Date(Date.now() - 7200000).toISOString(), // Ù…Ù†Ø° Ø³Ø§Ø¹ØªÙŠÙ†
      },
    ];

    return mockReadings;
  }
}
