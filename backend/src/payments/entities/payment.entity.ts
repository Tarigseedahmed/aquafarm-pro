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
import { Subscription } from './subscription.entity';

@Entity('payments')
@Index('IDX_payments_tenant', ['tenantId'])
@Index('IDX_payments_stripe_id', ['stripePaymentIntentId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  subscriptionId?: string;

  @Column({ unique: true })
  stripePaymentIntentId: string;

  @Column({ length: 50 })
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_action';

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 50 })
  paymentMethod: string; // 'card', 'bank_transfer', 'wallet', etc.

  @Column({ length: 200, nullable: true })
  description?: string;

  @Column('json', { nullable: true })
  metadata?: {
    invoiceId?: string;
    customerEmail?: string;
    billingAddress?: any;
    taxAmount?: number;
    discountAmount?: number;
  };

  @Column({ type: 'date', nullable: true })
  paidAt?: Date;

  @Column({ type: 'date', nullable: true })
  failedAt?: Date;

  @Column('text', { nullable: true })
  failureReason?: string;

  @Column('json', { nullable: true })
  refundInfo?: {
    amount?: number;
    reason?: string;
    refundedAt?: Date;
    stripeRefundId?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: Subscription;
}
