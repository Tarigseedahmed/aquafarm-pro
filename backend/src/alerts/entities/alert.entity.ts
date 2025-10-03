import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { Pond } from '../../ponds/entities/pond.entity';
import { WaterQualityReading } from '../../water-quality/entities/water-quality-reading.entity';
import { AlertRule } from './alert-rule.entity';

@Entity('alerts')
@Index('IDX_alerts_tenant_created', ['tenantId', 'createdAt'])
@Index('IDX_alerts_tenant_severity', ['tenantId', 'severity'])
@Index('IDX_alerts_tenant_status', ['tenantId', 'status'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  pondId?: string;

  @Column('uuid', { nullable: true })
  waterQualityReadingId?: string;

  @Column('uuid', { nullable: true })
  alertRuleId?: string;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  message: string;

  @Column({ default: 'warning' })
  severity: 'info' | 'warning' | 'critical';

  @Column({ default: 'active' })
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';

  @Column('json', { nullable: true })
  triggeredBy?: {
    parameter: string;
    value: number;
    threshold: number;
    operator: string;
  };

  @Column('json', { nullable: true })
  metadata?: {
    readingData?: any;
    ruleName?: string;
    notificationSent?: boolean;
    escalationLevel?: number;
  };

  @Column({ nullable: true })
  acknowledgedAt?: Date;

  @Column('uuid', { nullable: true })
  acknowledgedBy?: string;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @Column('uuid', { nullable: true })
  resolvedBy?: string;

  @Column('text', { nullable: true })
  resolutionNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Pond, { nullable: true })
  @JoinColumn({ name: 'pondId' })
  pond?: Pond;

  @ManyToOne(() => WaterQualityReading, { nullable: true })
  @JoinColumn({ name: 'waterQualityReadingId' })
  waterQualityReading?: WaterQualityReading;

  @ManyToOne(() => AlertRule, { nullable: true })
  @JoinColumn({ name: 'alertRuleId' })
  alertRule?: AlertRule;
}
