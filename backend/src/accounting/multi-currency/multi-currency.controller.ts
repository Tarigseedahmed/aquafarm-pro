import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  MultiCurrencyService,
  CurrencyConversion,
  ExchangeGainLoss,
} from './multi-currency.service';

export class CurrencyConversionDto {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rateDate: string;
}

export class ExchangeGainLossDto {
  transactionId: string;
  originalCurrency: string;
  functionalCurrency: string;
  originalAmount: number;
  transactionDate: string;
  settlementDate: string;
}

export class RecordGainLossDto {
  gainLoss: ExchangeGainLoss;
  description: string;
}

@ApiTags('Multi-Currency & FX')
@UseGuards(JwtAuthGuard)
@Controller('multi-currency')
export class MultiCurrencyController {
  constructor(private readonly multiCurrencyService: MultiCurrencyService) {}

  @Post('convert')
  @ApiOperation({ summary: 'Convert amount from one currency to another' })
  @ApiBody({ type: CurrencyConversionDto })
  async convertCurrency(@Body() data: CurrencyConversionDto): Promise<CurrencyConversion> {
    return this.multiCurrencyService.convertCurrency(
      data.fromCurrency,
      data.toCurrency,
      data.amount,
      data.rateDate,
    );
  }

  @Post('calculate-gain-loss')
  @ApiOperation({ summary: 'Calculate exchange gain/loss for a transaction' })
  @ApiBody({ type: ExchangeGainLossDto })
  async calculateExchangeGainLoss(@Body() data: ExchangeGainLossDto): Promise<ExchangeGainLoss> {
    return this.multiCurrencyService.calculateExchangeGainLoss(
      data.transactionId,
      data.originalCurrency,
      data.functionalCurrency,
      data.originalAmount,
      data.transactionDate,
      data.settlementDate,
    );
  }

  @Post('record-gain-loss')
  @ApiOperation({ summary: 'Record exchange gain/loss in journal entries' })
  @ApiBody({ type: RecordGainLossDto })
  async recordExchangeGainLoss(@Body() data: RecordGainLossDto, @Request() req) {
    return this.multiCurrencyService.recordExchangeGainLoss(
      req.tenantId,
      data.gainLoss,
      data.description,
    );
  }

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Get exchange rate for currency pair on specific date' })
  @ApiQuery({ name: 'fromCurrency', required: true })
  @ApiQuery({ name: 'toCurrency', required: true })
  @ApiQuery({ name: 'date', required: true })
  async getExchangeRate(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('date') date: string,
  ) {
    return this.multiCurrencyService.getExchangeRate(fromCurrency, toCurrency, date);
  }

  @Get('latest-rate')
  @ApiOperation({ summary: 'Get latest exchange rate for currency pair' })
  @ApiQuery({ name: 'fromCurrency', required: true })
  @ApiQuery({ name: 'toCurrency', required: true })
  async getLatestExchangeRate(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
  ) {
    return this.multiCurrencyService.getLatestExchangeRate(fromCurrency, toCurrency);
  }

  @Get('rate-history')
  @ApiOperation({ summary: 'Get exchange rate history for currency pair' })
  @ApiQuery({ name: 'fromCurrency', required: true })
  @ApiQuery({ name: 'toCurrency', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getExchangeRateHistory(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.multiCurrencyService.getExchangeRateHistory(
      fromCurrency,
      toCurrency,
      startDate,
      endDate,
    );
  }

  @Get('average-rate')
  @ApiOperation({ summary: 'Calculate average exchange rate for a period' })
  @ApiQuery({ name: 'fromCurrency', required: true })
  @ApiQuery({ name: 'toCurrency', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getAverageExchangeRate(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ averageRate: number }> {
    const averageRate = await this.multiCurrencyService.getAverageExchangeRate(
      fromCurrency,
      toCurrency,
      startDate,
      endDate,
    );
    return { averageRate };
  }

  @Get('supported-currencies')
  @ApiOperation({ summary: 'Get list of supported currencies' })
  async getSupportedCurrencies(): Promise<{ currencies: string[] }> {
    const currencies = await this.multiCurrencyService.getSupportedCurrencies();
    return { currencies };
  }

  @Get('validate-currency/:currency')
  @ApiOperation({ summary: 'Validate currency code format' })
  @ApiParam({ name: 'currency', description: 'Currency code (e.g., USD, EUR)' })
  async validateCurrency(@Param('currency') currency: string): Promise<{ valid: boolean }> {
    const valid = this.multiCurrencyService.isValidCurrencyCode(currency);
    return { valid };
  }

  @Get('conversion-summary')
  @ApiOperation({ summary: 'Get currency conversion summary for a period' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCurrencyConversionSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    return this.multiCurrencyService.getCurrencyConversionSummary(req.tenantId, startDate, endDate);
  }

  @Post('revalue-balances')
  @ApiOperation({ summary: 'Revalue foreign currency balances' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        revaluationDate: { type: 'string' },
        functionalCurrency: { type: 'string' },
      },
      required: ['revaluationDate', 'functionalCurrency'],
    },
  })
  async revalueForeignCurrencyBalances(
    @Body() data: { revaluationDate: string; functionalCurrency: string },
    @Request() req,
  ) {
    return this.multiCurrencyService.revalueForeignCurrencyBalances(
      req.tenantId,
      data.revaluationDate,
      data.functionalCurrency,
    );
  }
}
