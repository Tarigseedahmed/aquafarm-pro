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
import { Farm } from '../../farms/entities/farm.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';

@Entity('ponds')
@Index('IDX_ponds_tenant', ['tenantId'])
@Index('IDX_ponds_tenant_farm', ['tenantId', 'farmId'])
@Index('IDX_ponds_tenant_name', ['tenantId', 'name'])
export class Pond {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  area: number; // Ø¨Ø§Ù„Ù…ØªØ± Ø§Ù„Ù…Ø±Ø¨Ø¹

  @Column('decimal', { precision: 8, scale: 2 })
  depth: number; // Ø¨Ø§Ù„Ù…ØªØ±

  @Column('decimal', { precision: 12, scale: 2 })
  volume: number; // Ø¨Ø§Ù„Ù…ØªØ± Ø§Ù„Ù…ÙƒØ¹Ø¨

  @Column('int')
  maxCapacity: number; // Ø£Ù‚ØµÙ‰ Ø¹Ø¯Ø¯ Ø³Ù…Ùƒ

  @Column('int', { default: 0 })
  currentStockCount: number; // Ø§Ù„Ø¹Ø¯Ø¯ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù„Ù„Ø£Ø³Ù…Ø§Ùƒ

  @Column({ default: 'rectangular' })
  shape: string; // rectangular, circular, irregular

  @Column({ default: 'active' })
  status: string; // active, maintenance, inactive, cleaning

  @Column('json', { nullable: true })
  equipment?: string[]; // ['aerator', 'filter', 'heater', 'feeder']

  @Column('json', { nullable: true })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @Column({ nullable: true })
  notes?: string;

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @ManyToOne(() => Farm, (farm) => farm.ponds, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'farmId' })
  farm: Farm;

  @Column('uuid')
  farmId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'managedById' })
  managedBy: User;

  @Column('uuid')
  managedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Multi-tenancy relation
  @ManyToOne(() => Tenant, (tenant) => tenant.ponds, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string; // nullable during transition

  // Calculated properties
  get utilizationRate(): number {
    return this.maxCapacity > 0 ? (this.currentStockCount / this.maxCapacity) * 100 : 0;
  }

  get stockingDensity(): number {
    return this.area > 0 ? this.currentStockCount / this.area : 0;
  }

  get isOverstocked(): boolean {
    return this.currentStockCount > this.maxCapacity;
  }
}
