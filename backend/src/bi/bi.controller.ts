import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';
import { BiAnalysisService } from './bi-analysis.service';
import { GenerateAnalysisDto } from './dto/generate-analysis.dto';

@ApiTags('BI Analytics')
@Controller('bi')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BiController {
  constructor(private readonly biAnalysisService: BiAnalysisService) {}

  @Post('profitability')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Generate profitability analysis' })
  @ApiResponse({ status: 201, description: 'Profitability analysis generated successfully' })
  @ApiStandardErrorResponses()
  async generateProfitabilityAnalysis(
    @Body(new ValidationPipe()) generateDto: GenerateAnalysisDto,
    @Request() req,
  ) {
    return await this.biAnalysisService.generateProfitabilityAnalysis(
      req.tenantId,
      new Date(generateDto.startDate),
      new Date(generateDto.endDate),
      generateDto.farmId,
      generateDto.pondId,
    );
  }

  @Get('profitability/trends')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Get profitability trends over time' })
  @ApiResponse({ status: 200, description: 'Profitability trends retrieved successfully' })
  @ApiStandardErrorResponses()
  async getProfitabilityTrends(
    @Request() req,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 12,
  ) {
    return await this.biAnalysisService.getProfitabilityTrends(req.tenantId, period, limit);
  }

  @Get('feed-costs')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Get feed cost analysis' })
  @ApiResponse({ status: 200, description: 'Feed cost analysis retrieved successfully' })
  @ApiStandardErrorResponses()
  async getFeedCostAnalysis(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('pondId') pondId?: string,
  ) {
    return await this.biAnalysisService.getFeedCostAnalysis(
      req.tenantId,
      new Date(startDate),
      new Date(endDate),
      pondId,
    );
  }

  @Get('kpis')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  @ApiStandardErrorResponses()
  async getKPIs(
    @Request() req,
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    return await this.biAnalysisService.getKPIs(req.tenantId, period);
  }

  @Get('dashboard')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Get comprehensive dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiStandardErrorResponses()
  async getDashboardData(@Request() req) {
    const [kpis, trends, feedCosts] = await Promise.all([
      this.biAnalysisService.getKPIs(req.tenantId, 'month'),
      this.biAnalysisService.getProfitabilityTrends(req.tenantId, 'monthly', 6),
      this.biAnalysisService.getFeedCostAnalysis(
        req.tenantId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
      ),
    ]);

    return {
      kpis,
      trends,
      feedCosts: {
        totalCost: feedCosts.totalFeedCost,
        totalAmount: feedCosts.totalFeedAmount,
        averagePrice: feedCosts.averageFeedPrice,
        byType: feedCosts.feedCostsByType,
      },
      recommendations: this.generateRecommendations(kpis, trends),
    };
  }

  @Get('reports/profitability')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Generate profitability report' })
  @ApiResponse({ status: 200, description: 'Profitability report generated successfully' })
  @ApiStandardErrorResponses()
  async generateProfitabilityReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' | 'pdf' = 'json',
  ) {
    const analysis = await this.biAnalysisService.generateProfitabilityAnalysis(
      req.tenantId,
      new Date(startDate),
      new Date(endDate),
    );

    if (format === 'csv') {
      return this.generateCSVReport(analysis);
    }

    return analysis;
  }

  @Get('reports/feed-costs')
  @Permissions('bi.read')
  @ApiOperation({ summary: 'Generate feed cost report' })
  @ApiResponse({ status: 200, description: 'Feed cost report generated successfully' })
  @ApiStandardErrorResponses()
  async generateFeedCostReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' | 'pdf' = 'json',
  ) {
    const feedCosts = await this.biAnalysisService.getFeedCostAnalysis(
      req.tenantId,
      new Date(startDate),
      new Date(endDate),
    );

    if (format === 'csv') {
      return this.generateFeedCostCSV(feedCosts);
    }

    return feedCosts;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(kpis: any, trends: any[]): string[] {
    const recommendations: string[] = [];

    // FCR recommendations
    if (kpis.fcr > 2.0) {
      recommendations.push(
        'Feed Conversion Ratio is high. Consider optimizing feeding schedule and feed quality.',
      );
    }

    // Survival rate recommendations
    if (kpis.survivalRate < 80) {
      recommendations.push(
        'Survival rate is low. Review water quality management and disease prevention.',
      );
    }

    // Profit margin recommendations
    if (kpis.profitMargin < 10) {
      recommendations.push('Profit margin is low. Consider cost optimization and price review.');
    }

    // Trend analysis
    if (trends.length >= 2) {
      const latest = trends[trends.length - 1];
      const previous = trends[trends.length - 2];

      if (latest.netProfit < previous.netProfit) {
        recommendations.push('Profit is declining. Review recent changes in operations.');
      }
    }

    return recommendations;
  }

  /**
   * Generate CSV report for profitability analysis
   */
  private generateCSVReport(analysis: any): string {
    const headers = ['Metric', 'Value', 'Unit'];

    const rows = [
      ['Total Revenue', analysis.totalRevenue, 'SAR'],
      ['Total Costs', analysis.totalCosts, 'SAR'],
      ['Net Profit', analysis.netProfit, 'SAR'],
      ['Profit Margin', analysis.netProfitMargin, '%'],
      ['Total Production', analysis.totalProduction, 'kg'],
      ['Feed Conversion Ratio', analysis.feedConversionRatio, ''],
      ['Survival Rate', analysis.survivalRate, '%'],
      ['Return on Investment', analysis.returnOnInvestment, '%'],
    ];

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Generate CSV report for feed costs
   */
  private generateFeedCostCSV(feedCosts: any): string {
    const headers = [
      'Feed Type',
      'Amount (kg)',
      'Total Cost (SAR)',
      'Average Price (SAR/kg)',
      'Usage Count',
    ];

    const rows = Object.entries(feedCosts.feedCostsByType).map(([type, data]: [string, any]) => [
      type,
      data.amount,
      data.cost,
      data.cost / data.amount,
      data.count,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
