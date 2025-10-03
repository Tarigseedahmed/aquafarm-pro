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
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';
import { Pond } from '../../ponds/entities/pond.entity';

@Entity('water_quality_readings')
@Index('IDX_wqr_tenant_createdAt', ['tenantId', 'createdAt'])
@Index('IDX_wqr_tenant_pond_createdAt', ['tenantId', 'pondId', 'createdAt'])
export class WaterQualityReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 4, scale: 2 })
  temperature: number; // Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© (Ù…Ø¦ÙˆÙŠØ©)

  @Column('decimal', { precision: 4, scale: 2 })
  ph: number; // Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø­Ù…ÙˆØ¶Ø©

  @Column('decimal', { precision: 6, scale: 2 })
  dissolvedOxygen: number; // Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ø§Ù„Ù…Ø°Ø§Ø¨ (mg/L)

  @Column('decimal', { precision: 6, scale: 2 })
  ammonia: number; // Ø§Ù„Ø£Ù…ÙˆÙ†ÙŠØ§ (mg/L)

  @Column('decimal', { precision: 6, scale: 2 })
  nitrite: number; // Ø§Ù„Ù†ØªØ±ÙŠØª (mg/L)

  @Column('decimal', { precision: 6, scale: 2 })
  nitrate: number; // Ø§Ù„Ù†ØªØ±Ø§Øª (mg/L)

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  salinity?: number; // Ø§Ù„Ù…Ù„ÙˆØ­Ø© (ppt) - Ù„Ù„Ù…Ø²Ø§Ø±Ø¹ Ø§Ù„Ø¨Ø­Ø±ÙŠØ©

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  turbidity?: number; // Ø§Ù„Ø¹ÙƒØ§Ø±Ø© (NTU)

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  alkalinity?: number; // Ø§Ù„Ù‚Ù„ÙˆÙŠØ© (mg/L CaCO3)

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  hardness?: number; // Ø§Ù„Ø¹Ø³Ø±Ø© (mg/L CaCO3)

  @Column({ default: 'manual' })
  readingMethod: string; // manual, automatic, sensor

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: 'normal' })
  status: string; // normal, warning, critical

  @Column('json', { nullable: true })
  alerts?: string[]; // ['high_temperature', 'low_oxygen', 'high_ammonia']

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @Column('uuid', { nullable: true })
  pondId: string;

  @ManyToOne(() => Pond, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'pondId' })
  pond: Pond;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column('uuid')
  recordedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Multi-tenancy
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
