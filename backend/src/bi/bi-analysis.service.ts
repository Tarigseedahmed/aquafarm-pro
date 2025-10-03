import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProfitabilityAnalysis } from './entities/profitability-analysis.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';

@Injectable()
export class BiAnalysisService {
  private readonly logger = new Logger(BiAnalysisService.name);

  constructor(
    @InjectRepository(ProfitabilityAnalysis)
    private profitabilityRepository: Repository<ProfitabilityAnalysis>,
    @InjectRepository(WaterQualityReading)
    private waterQualityRepository: Repository<WaterQualityReading>,
    @InjectRepository(FishBatch)
    private fishBatchRepository: Repository<FishBatch>,
    @InjectRepository(FeedingRecord)
    private feedingRepository: Repository<FeedingRecord>,
  ) {}

  /**
   * Generate profitability analysis for a specific period
   */
  async generateProfitabilityAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    farmId?: string,
    pondId?: string,
  ): Promise<ProfitabilityAnalysis> {
    try {
      // Calculate revenue metrics
      const revenueMetrics = await this.calculateRevenueMetrics(
        tenantId,
        startDate,
        endDate,
        farmId,
        pondId,
      );

      // Calculate cost metrics
      const costMetrics = await this.calculateCostMetrics(
        tenantId,
        startDate,
        endDate,
        farmId,
        pondId,
      );

      // Calculate production metrics
      const productionMetrics = await this.calculateProductionMetrics(
        tenantId,
        startDate,
        endDate,
        farmId,
        pondId,
      );

      // Calculate profitability metrics
      const profitabilityMetrics = this.calculateProfitabilityMetrics(
        revenueMetrics,
        costMetrics,
        productionMetrics,
      );

      // Create analysis record
      const analysis = this.profitabilityRepository.create({
        tenantId,
        farmId,
        pondId,
        analysisPeriod: this.determineAnalysisPeriod(startDate, endDate),
        startDate,
        endDate,
        ...revenueMetrics,
        ...costMetrics,
        ...productionMetrics,
        ...profitabilityMetrics,
      });

      return await this.profitabilityRepository.save(analysis);
    } catch (error) {
      this.logger.error(`Error generating profitability analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate revenue metrics
   */
  private async calculateRevenueMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    farmId?: string,
    pondId?: string,
  ) {
    // Touch parameters to avoid unused warnings until real implementation integrates accounting.
    void tenantId;
    void startDate;
    void endDate;
    void farmId;
    void pondId;
    // This would integrate with accounting system
    // For now, return mock data
    return {
      totalRevenue: 50000,
      fishSalesRevenue: 45000,
      otherRevenue: 5000,
    };
  }

  /**
   * Calculate cost metrics
   */
  private async calculateCostMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    farmId?: string,
    pondId?: string,
  ) {
    // Calculate feed costs from feeding records
    const feedingRecords = await this.feedingRepository.find({
      where: {
        tenantId,
        ...(pondId && { pondId }),
        createdAt: Between(startDate, endDate),
      },
    });

    // cost stored as total cost of this feeding event (record.cost). If missing treat as 0.
    const feedCosts = feedingRecords.reduce((total, record: any) => {
      return total + (record.cost || 0);
    }, 0);

    // Other costs would come from accounting system
    return {
      totalCosts: feedCosts + 15000, // feed + other costs
      feedCosts,
      laborCosts: 8000,
      utilitiesCosts: 2000,
      maintenanceCosts: 3000,
      otherCosts: 2000,
    };
  }

  /**
   * Calculate production metrics
   */
  private async calculateProductionMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    farmId?: string,
    pondId?: string,
  ) {
    // Get fish batches for the period
    const fishBatches = await this.fishBatchRepository.find({
      where: {
        tenantId,
        ...(pondId && { pondId }),
        createdAt: Between(startDate, endDate),
      },
    });

    const totalProduction = fishBatches.reduce((total, batch) => {
      return total + batch.currentCount * batch.averageWeight;
    }, 0);

    const totalFishCount = fishBatches.reduce((total, batch) => {
      return total + batch.currentCount;
    }, 0);

    const averageWeight = totalFishCount > 0 ? totalProduction / totalFishCount : 0;

    // Calculate FCR from feeding records
    const feedingRecords = await this.feedingRepository.find({
      where: {
        tenantId,
        ...(pondId && { pondId }),
        createdAt: Between(startDate, endDate),
      },
    });

    const totalFeedAmount = feedingRecords.reduce((total, record: any) => {
      return total + (record.feedAmount || 0);
    }, 0);

    const feedConversionRatio = totalProduction > 0 ? totalFeedAmount / totalProduction : 0;

    // Calculate survival rate
    const initialStock = fishBatches.reduce((total, batch) => {
      return total + (batch.initialCount || 0);
    }, 0);

    const survivalRate = initialStock > 0 ? (totalFishCount / initialStock) * 100 : 0;

    return {
      totalProduction,
      averageWeight,
      totalFishCount,
      feedConversionRatio,
      survivalRate,
    };
  }

  /**
   * Calculate profitability metrics
   */
  private calculateProfitabilityMetrics(
    revenueMetrics: any,
    costMetrics: any,
    productionMetrics: any,
  ) {
    const grossProfit = revenueMetrics.totalRevenue - costMetrics.totalCosts;
    const grossProfitMargin =
      revenueMetrics.totalRevenue > 0 ? (grossProfit / revenueMetrics.totalRevenue) * 100 : 0;

    const netProfit = grossProfit; // Simplified - would include other expenses
    const netProfitMargin =
      revenueMetrics.totalRevenue > 0 ? (netProfit / revenueMetrics.totalRevenue) * 100 : 0;

    const returnOnInvestment =
      costMetrics.totalCosts > 0 ? (netProfit / costMetrics.totalCosts) * 100 : 0;

    const costPerKg =
      productionMetrics.totalProduction > 0
        ? costMetrics.totalCosts / productionMetrics.totalProduction
        : 0;

    const costPerFish =
      productionMetrics.totalFishCount > 0
        ? costMetrics.totalCosts / productionMetrics.totalFishCount
        : 0;

    const feedCostPerKg =
      productionMetrics.totalProduction > 0
        ? costMetrics.feedCosts / productionMetrics.totalProduction
        : 0;

    const revenuePerKg =
      productionMetrics.totalProduction > 0
        ? revenueMetrics.totalRevenue / productionMetrics.totalProduction
        : 0;

    const revenuePerFish =
      productionMetrics.totalFishCount > 0
        ? revenueMetrics.totalRevenue / productionMetrics.totalFishCount
        : 0;

    const averageSellingPrice =
      productionMetrics.totalFishCount > 0
        ? revenueMetrics.fishSalesRevenue / productionMetrics.totalFishCount
        : 0;

    return {
      grossProfit,
      grossProfitMargin,
      netProfit,
      netProfitMargin,
      returnOnInvestment,
      costPerKg,
      costPerFish,
      feedCostPerKg,
      revenuePerKg,
      revenuePerFish: revenuePerFish,
      averageSellingPrice,
    };
  }

  /**
   * Determine analysis period based on date range
   */
  private determineAnalysisPeriod(startDate: Date, endDate: Date): string {
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 1) return 'daily';
    if (diffInDays <= 7) return 'weekly';
    if (diffInDays <= 31) return 'monthly';
    return 'yearly';
  }

  /**
   * Get profitability trends over time
   */
  async getProfitabilityTrends(
    tenantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    limit = 12,
  ) {
    const analyses = await this.profitabilityRepository.find({
      where: {
        tenantId,
        analysisPeriod: period,
      },
      order: { startDate: 'DESC' },
      take: limit,
    });

    return analyses.reverse(); // Return in chronological order
  }

  /**
   * Get feed cost analysis
   */
  async getFeedCostAnalysis(tenantId: string, startDate: Date, endDate: Date, pondId?: string) {
    const feedingRecords = await this.feedingRepository.find({
      where: {
        tenantId,
        ...(pondId && { pondId }),
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by feed type
    const feedCostsByType = feedingRecords.reduce(
      (acc: Record<string, { amount: number; cost: number; count: number }>, record: any) => {
        const feedType = record.feedType || 'Unknown';
        if (!acc[feedType]) {
          acc[feedType] = { amount: 0, cost: 0, count: 0 };
        }
        acc[feedType].amount += record.feedAmount || 0;
        acc[feedType].cost += record.cost || 0;
        acc[feedType].count += 1;
        return acc;
      },
      {},
    );

    // Calculate daily feed costs
    const dailyFeedCosts = feedingRecords.reduce(
      (acc: Record<string, { amount: number; cost: number }>, record: any) => {
        const date = (
          record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt)
        )
          .toISOString()
          .split('T')[0];
        if (!acc[date]) {
          acc[date] = { amount: 0, cost: 0 };
        }
        acc[date].amount += record.feedAmount || 0;
        acc[date].cost += record.cost || 0;
        return acc;
      },
      {},
    );

    return {
      totalFeedCost: feedingRecords.reduce((total, record: any) => total + (record.cost || 0), 0),
      totalFeedAmount: feedingRecords.reduce(
        (total, record: any) => total + (record.feedAmount || 0),
        0,
      ),
      averageFeedPrice: (() => {
        if (feedingRecords.length === 0) return 0;
        const totalCost = feedingRecords.reduce((sum, record: any) => sum + (record.cost || 0), 0);
        const totalAmount = feedingRecords.reduce(
          (sum, record: any) => sum + (record.feedAmount || 0),
          0,
        );
        return totalAmount > 0 ? totalCost / totalAmount : 0;
      })(),
      feedCostsByType,
      dailyFeedCosts,
      records: feedingRecords,
    };
  }

  /**
   * Get KPIs for dashboard
   */
  async getKPIs(tenantId: string, period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const analysis = await this.generateProfitabilityAnalysis(tenantId, startDate, now);

    return {
      revenue: analysis.totalRevenue,
      costs: analysis.totalCosts,
      profit: analysis.netProfit,
      profitMargin: analysis.netProfitMargin,
      production: analysis.totalProduction,
      fcr: analysis.feedConversionRatio,
      survivalRate: analysis.survivalRate,
      roi: analysis.returnOnInvestment,
    };
  }
}
