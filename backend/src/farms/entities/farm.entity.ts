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
import { Pond } from '../../ponds/entities/pond.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';

@Entity('farms')
@Index('IDX_farms_tenant', ['tenantId'])
@Index('IDX_farms_tenant_owner', ['tenantId', 'ownerId'])
@Index('IDX_farms_tenant_name', ['tenantId', 'name'])
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalArea?: number; // Ø¨Ø§Ù„Ù…ØªØ± Ø§Ù„Ù…Ø±Ø¨Ø¹

  @Column()
  farmType: string; // marine, freshwater, brackish

  @Column({ default: 'active' })
  status: string; // active, inactive, maintenance

  @Column('json', { nullable: true })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  licenseNumber?: string;

  @Column('json', { nullable: true })
  facilities?: string[]; // ['laboratory', 'feed_storage', 'processing_plant']

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column('uuid')
  ownerId: string;

  @OneToMany(() => Pond, (pond) => pond.farm)
  ponds: Pond[];

  // Multi-tenancy relation
  @ManyToOne(() => Tenant, (tenant) => tenant.farms)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string; // nullable temporarily until all records set

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
