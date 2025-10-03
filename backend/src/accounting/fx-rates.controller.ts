import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FxRatesService } from './fx-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('FX Rates')
@UseGuards(JwtAuthGuard)
@Controller('fx')
export class FxRatesController {
  constructor(private readonly fx: FxRatesService) {}

  @Get('rate')
  @ApiOperation({ summary: 'Get rate for base/quote on a given date' })
  @ApiQuery({ name: 'base', required: true })
  @ApiQuery({ name: 'quote', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'ISO date YYYY-MM-DD' })
  getRate(@Query('base') base: string, @Query('quote') quote: string, @Query('date') date: string) {
    return this.fx.getRate(base, quote, date);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest available rate for base/quote' })
  @ApiQuery({ name: 'base', required: true })
  @ApiQuery({ name: 'quote', required: true })
  latest(@Query('base') base: string, @Query('quote') quote: string) {
    return this.fx.latest(base, quote);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync a pair from external provider for a given date' })
  @ApiQuery({ name: 'base', required: true })
  @ApiQuery({ name: 'quote', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'ISO date YYYY-MM-DD' })
  async sync(
    @Query('base') base: string,
    @Query('quote') quote: string,
    @Query('date') date: string,
  ) {
    const saved = await this.fx.syncPair(base, quote, date);
    return { message: 'synced', data: saved };
  }
}
