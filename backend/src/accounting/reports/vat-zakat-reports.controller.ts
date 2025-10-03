import { Controller, Get, Post, Query, Body, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  VATZakatReportsService,
  VATReport,
  ZakatReport,
  TaxSummaryReport,
} from './vat-zakat-reports.service';
import { Response } from 'express';

export class ZakatReportDto {
  reportDate: string;
  zakatRate?: number;
}

export class TaxSummaryDto {
  startDate: string;
  endDate: string;
  countryCode?: string;
}

@ApiTags('VAT & Zakat Reports')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class VATZakatReportsController {
  constructor(private readonly reportsService: VATZakatReportsService) {}

  @Get('vat')
  @ApiOperation({ summary: 'Generate VAT report for a period' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'countryCode', required: false })
  async generateVATReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('countryCode') countryCode: string = 'SA',
    @Req() req: any,
  ): Promise<VATReport> {
    return this.reportsService.generateVATReport(req.tenantId, startDate, endDate, countryCode);
  }

  @Post('zakat')
  @ApiOperation({ summary: 'Generate Zakat report for a specific date' })
  @ApiBody({ type: ZakatReportDto })
  async generateZakatReport(@Body() data: ZakatReportDto, @Req() req: any): Promise<ZakatReport> {
    return this.reportsService.generateZakatReport(
      req.tenantId,
      data.reportDate,
      data.zakatRate || 2.5,
    );
  }

  @Post('tax-summary')
  @ApiOperation({ summary: 'Generate tax summary report' })
  @ApiBody({ type: TaxSummaryDto })
  async generateTaxSummaryReport(
    @Body() data: TaxSummaryDto,
    @Req() req: any,
  ): Promise<TaxSummaryReport> {
    return this.reportsService.generateTaxSummaryReport(
      req.tenantId,
      data.startDate,
      data.endDate,
      data.countryCode || 'SA',
    );
  }

  @Get('vat-rates')
  @ApiOperation({ summary: 'Get VAT rates for a country' })
  @ApiQuery({ name: 'countryCode', required: true })
  async getVATRates(@Query('countryCode') countryCode: string, @Req() req: any) {
    return this.reportsService.getVATRates(countryCode, req.tenantId);
  }

  @Get('vat/export')
  @ApiOperation({ summary: 'Export VAT report to CSV' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'countryCode', required: false })
  async exportVATReportToCSV(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('countryCode') countryCode: string = 'SA',
    @Req() req: any,
    @Res() res: Response,
  ) {
    const csvData = await this.reportsService.exportVATReportToCSV(
      req.tenantId,
      startDate,
      endDate,
      countryCode,
    );

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="vat-report-${startDate}-to-${endDate}.csv"`,
    });

    res.send(csvData);
  }

  @Get('zakat/export')
  @ApiOperation({ summary: 'Export Zakat report to CSV' })
  @ApiQuery({ name: 'reportDate', required: true })
  @ApiQuery({ name: 'zakatRate', required: false })
  async exportZakatReportToCSV(
    @Query('reportDate') reportDate: string,
    @Query('zakatRate') zakatRate: number = 2.5,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const csvData = await this.reportsService.exportZakatReportToCSV(
      req.tenantId,
      reportDate,
      zakatRate,
    );

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="zakat-report-${reportDate}.csv"`,
    });

    res.send(csvData);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check reports service health' })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'VAT & Zakat Reports',
    };
  }
}
