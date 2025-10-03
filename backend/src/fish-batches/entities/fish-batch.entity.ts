import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FeedingRecord } from './feeding-record.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { Pond } from '../../ponds/entities/pond.entity';

@Entity('fish_batches')
@Index('IDX_fish_batches_tenant_pond', ['tenantId', 'pondId'])
@Index('IDX_fish_batches_tenant_status', ['tenantId', 'status'])
export class FishBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  batchNumber: string; // Ø±Ù‚Ù… Ø§Ù„Ø¯ÙØ¹Ø©

  @Column()
  species: string; // Ù†ÙˆØ¹ Ø§Ù„Ø³Ù…Ùƒ

  @Column({ nullable: true })
  variety?: string; // Ø§Ù„ØµÙ†Ù (optional)

  @Column('int')
  initialCount: number; // Ø§Ù„Ø¹Ø¯Ø¯ Ø§Ù„Ø§Ø¨ØªØ¯Ø§Ø¦ÙŠ

  @Column('int')
  currentCount: number; // Ø§Ù„Ø¹Ø¯Ø¯ Ø§Ù„Ø­Ø§Ù„ÙŠ

  @Column('decimal', { precision: 8, scale: 2 })
  averageWeight: number; // Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ù…ØªÙˆØ³Ø· (Ø¬Ø±Ø§Ù…)

  @Column('decimal', { precision: 10, scale: 2 })
  totalBiomass: number; // Ø§Ù„ÙƒØªÙ„Ø© Ø§Ù„Ø­ÙŠÙˆÙŠØ© Ø§Ù„ÙƒÙ„ÙŠØ© (ÙƒÙŠÙ„Ùˆ)

  @Column()
  stockingDate: Date; // ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ®Ø²ÙŠÙ†

  @Column({ nullable: true })
  expectedHarvestDate?: Date; // Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØªÙˆÙ‚Ø¹ Ù„Ù„Ø­ØµØ§Ø¯

  @Column({ nullable: true })
  actualHarvestDate?: Date; // Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„ÙØ¹Ù„ÙŠ Ù„Ù„Ø­ØµØ§Ø¯

  @Column({ default: 'active' })
  status: string; // active, harvested, partial_harvest, dead

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  survivalRate?: number; // Ù…Ø¹Ø¯Ù„ Ø§Ù„Ø¨Ù‚Ø§Ø¡ Ø¹Ù„Ù‰ Ù‚ÙŠØ¯ Ø§Ù„Ø­ÙŠØ§Ø© (%)

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  feedConversionRatio?: number; // Ù…Ø¹Ø¯Ù„ ØªØ­ÙˆÙŠÙ„ Ø§Ù„ØºØ°Ø§Ø¡

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  targetWeight?: number; // Ø§Ù„ÙˆØ²Ù† Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù (Ø¬Ø±Ø§Ù…)

  @Column({ nullable: true })
  supplier?: string; // Ø§Ù„Ù…ÙˆØ±Ø¯

  @Column({ nullable: true })
  notes?: string;

  @Column('json', { nullable: true })
  healthStatus?: {
    diseases?: string[];
    treatments?: string[];
    mortality?: number;
  };

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @Column('uuid', { nullable: true })
  pondId: string;

  @ManyToOne(() => Pond, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'pondId' })
  pond?: Pond;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'managedById' })
  managedBy: User;

  @Column('uuid')
  managedById: string;

  @OneToMany(() => FeedingRecord, (record) => record.fishBatch)
  feedingRecords: FeedingRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Multi-tenancy
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
