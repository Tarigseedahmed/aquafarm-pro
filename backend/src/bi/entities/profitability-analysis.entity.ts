import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { Pond } from '../../ponds/entities/pond.entity';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('profitability_analysis')
@Index('IDX_profitability_tenant_period', ['tenantId', 'analysisPeriod'])
@Index('IDX_profitability_pond_period', ['pondId', 'analysisPeriod'])
export class ProfitabilityAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  farmId?: string;

  @Column('uuid', { nullable: true })
  pondId?: string;

  @Column({ length: 50 })
  analysisPeriod: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // Revenue metrics
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  fishSalesRevenue: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  otherRevenue: number;

  // Cost metrics
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalCosts: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  feedCosts: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  laborCosts: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  utilitiesCosts: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  maintenanceCosts: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  otherCosts: number;

  // Production metrics
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalProduction: number; // in kg

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  averageWeight: number; // in kg per fish

  @Column('int', { default: 0 })
  totalFishCount: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  feedConversionRatio: number; // FCR

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  survivalRate: number; // percentage

  // Profitability metrics
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  grossProfit: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  grossProfitMargin: number; // percentage

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  netProfit: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  netProfitMargin: number; // percentage

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  returnOnInvestment: number; // percentage

  // Cost per unit metrics
  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  costPerKg: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  costPerFish: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  feedCostPerKg: number;

  // Revenue per unit metrics
  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  revenuePerKg: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  revenuePerFish: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  averageSellingPrice: number;

  // Additional metrics
  @Column('json', { nullable: true })
  breakdown?: {
    feedCostsByType?: Record<string, number>;
    laborCostsByCategory?: Record<string, number>;
    revenueByProduct?: Record<string, number>;
    seasonalFactors?: Record<string, number>;
  };

  @Column('json', { nullable: true })
  comparisons?: {
    previousPeriod?: {
      revenue: number;
      costs: number;
      profit: number;
      change: number;
    };
    industryBenchmarks?: {
      averageFCR: number;
      averageSurvivalRate: number;
      averageProfitMargin: number;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Farm, { nullable: true })
  @JoinColumn({ name: 'farmId' })
  farm?: Farm;

  @ManyToOne(() => Pond, { nullable: true })
  @JoinColumn({ name: 'pondId' })
  pond?: Pond;
}
