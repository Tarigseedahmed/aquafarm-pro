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

@Entity('subscriptions')
@Index('IDX_subscriptions_tenant', ['tenantId'])
@Index('IDX_subscriptions_stripe_id', ['stripeSubscriptionId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ unique: true })
  stripeSubscriptionId: string;

  @Column({ unique: true })
  stripeCustomerId: string;

  @Column({ length: 50 })
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'trialing'
    | 'unpaid';

  @Column({ length: 50 })
  planId: string; // 'basic', 'professional', 'enterprise'

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string; // 'SAR', 'USD', etc.

  @Column({ length: 20 })
  interval: string; // 'month', 'year'

  @Column({ type: 'date', nullable: true })
  currentPeriodStart?: Date;

  @Column({ type: 'date', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ type: 'date', nullable: true })
  trialStart?: Date;

  @Column({ type: 'date', nullable: true })
  trialEnd?: Date;

  @Column({ type: 'date', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'date', nullable: true })
  endedAt?: Date;

  @Column('json', { nullable: true })
  metadata?: {
    features?: string[];
    limits?: {
      users?: number;
      ponds?: number;
      farms?: number;
      storage?: number; // in GB
    };
    addons?: Record<string, any>;
  };

  @Column('json', { nullable: true })
  billingInfo?: {
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId?: string;
    vatNumber?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
