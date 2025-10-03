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

@Entity('alert_rules')
@Index('IDX_alert_rules_tenant_pond', ['tenantId', 'pondId'])
@Index('IDX_alert_rules_tenant_active', ['tenantId', 'isActive'])
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  pondId?: string; // null means applies to all ponds

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column('json')
  conditions: AlertCondition[];

  @Column({ default: 'warning' })
  severity: 'info' | 'warning' | 'critical';

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  cooldownMinutes: number; // Prevent spam alerts

  @Column('json', { nullable: true })
  notificationChannels: string[]; // ['email', 'sms', 'push', 'webhook']

  @Column('json', { nullable: true })
  customMessage?: string;

  @Column({ default: 0 })
  triggerCount: number;

  @Column({ nullable: true })
  lastTriggeredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Pond, { nullable: true })
  @JoinColumn({ name: 'pondId' })
  pond?: Pond;
}

export interface AlertCondition {
  parameter: string; // 'temperature', 'ph', 'dissolvedOxygen', etc.
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between';
  value: number | [number, number]; // single value or range for 'between'
  unit?: string; // 'celsius', 'mg/L', etc.
}

export interface AlertThreshold {
  parameter: string;
  min: number;
  max: number;
  criticalMin?: number;
  criticalMax?: number;
  unit: string;
}
