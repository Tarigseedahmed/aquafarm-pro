import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TaxEngineService, TaxCalculationResult, TaxSummary } from './tax-engine.service';

export class TaxCalculationDto {
  amount: number;
  currency: string;
  taxCode: string;
  countryCode: string;
  date: string;
  isInclusive?: boolean;
}

export class TaxCalculationWithConversionDto extends TaxCalculationDto {
  targetCurrency: string;
}

export class TaxSummaryDto {
  calculations: TaxCalculationResult[];
  currency: string;
}

@ApiTags('Tax Engine')
@UseGuards(JwtAuthGuard)
@Controller('tax')
export class TaxEngineController {
  constructor(private readonly taxEngine: TaxEngineService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate tax for a single transaction' })
  @ApiBody({ type: TaxCalculationDto })
  async calculateTax(@Body() request: TaxCalculationDto): Promise<TaxCalculationResult> {
    return this.taxEngine.calculateTax(request);
  }

  @Post('calculate-with-conversion')
  @ApiOperation({ summary: 'Calculate tax with currency conversion' })
  @ApiBody({ type: TaxCalculationWithConversionDto })
  async calculateTaxWithConversion(
    @Body() request: TaxCalculationWithConversionDto,
  ): Promise<TaxCalculationResult> {
    const { targetCurrency, ...baseRequest } = request;
    return this.taxEngine.calculateTaxWithCurrencyConversion(baseRequest, targetCurrency);
  }

  @Post('summary')
  @ApiOperation({ summary: 'Generate tax summary for multiple calculations' })
  @ApiBody({ type: TaxSummaryDto })
  async generateTaxSummary(@Body() request: TaxSummaryDto): Promise<TaxSummary> {
    return this.taxEngine.generateTaxSummary(request.calculations, request.currency);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get available tax rates for a country' })
  @ApiQuery({ name: 'countryCode', required: true })
  async getTaxRates(@Query('countryCode') countryCode: string) {
    return this.taxEngine.getAvailableTaxRates(countryCode);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Get available tax profiles' })
  async getTaxProfiles() {
    return this.taxEngine.getTaxProfiles();
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate tax code for a country' })
  @ApiQuery({ name: 'taxCode', required: true })
  @ApiQuery({ name: 'countryCode', required: true })
  async validateTaxCode(
    @Query('taxCode') taxCode: string,
    @Query('countryCode') countryCode: string,
  ): Promise<{ valid: boolean }> {
    const valid = await this.taxEngine.validateTaxCode(taxCode, countryCode);
    return { valid };
  }

  @Get('rate-info')
  @ApiOperation({ summary: 'Get detailed tax rate information' })
  @ApiQuery({ name: 'taxCode', required: true })
  @ApiQuery({ name: 'countryCode', required: true })
  async getTaxRateInfo(
    @Query('taxCode') taxCode: string,
    @Query('countryCode') countryCode: string,
  ) {
    return this.taxEngine.getTaxRateInfo(taxCode, countryCode);
  }
}
