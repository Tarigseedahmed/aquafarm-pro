import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FishBatch } from './fish-batch.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';

@Entity('feeding_records')
@Index('IDX_feeding_records_tenant_batch_time', ['tenantId', 'fishBatchId', 'feedingTime'])
export class FeedingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 8, scale: 2 })
  feedAmount: number; // ÙƒÙ…ÙŠØ© Ø§Ù„Ø¹Ù„Ù (ÙƒÙŠÙ„Ùˆ)

  @Column()
  feedType: string; // Ù†ÙˆØ¹ Ø§Ù„Ø¹Ù„Ù

  @Column({ nullable: true })
  feedBrand?: string; // Ù…Ø§Ø±ÙƒØ© Ø§Ù„Ø¹Ù„Ù

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  proteinPercentage?: number; // Ù†Ø³Ø¨Ø© Ø§Ù„Ø¨Ø±ÙˆØªÙŠÙ†

  @Column({ default: 'manual' })
  feedingMethod: string; // manual, automatic

  @Column('time')
  feedingTime: string; // ÙˆÙ‚Øª Ø§Ù„ØªØºØ°ÙŠØ©

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  waterTemperature?: number; // Ø¯Ø±Ø¬Ø© Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ø¡ ÙˆÙ‚Øª Ø§Ù„ØªØºØ°ÙŠØ©

  @Column({ nullable: true })
  weatherConditions?: string; // Ø§Ù„Ø£Ø­ÙˆØ§Ù„ Ø§Ù„Ø¬ÙˆÙŠØ©

  @Column({ default: 'good' })
  fishAppetite: string; // good, moderate, poor

  @Column({ nullable: true })
  notes?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost?: number; // ØªÙƒÙ„ÙØ© Ø§Ù„Ø¹Ù„Ù

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @ManyToOne(() => FishBatch, (batch) => batch.feedingRecords, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'fishBatchId' })
  fishBatch: FishBatch;

  @Column('uuid')
  fishBatchId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column('uuid')
  recordedById: string;

  @CreateDateColumn()
  createdAt: Date;

  // Multi-tenancy
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
