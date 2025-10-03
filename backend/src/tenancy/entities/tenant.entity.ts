import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { Pond } from '../../ponds/entities/pond.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Human readable name (e.g. Ø´Ø±ÙƒØ© Ø§Ù„Ø£Ù…Ù„ Ù„Ù„Ø¥Ø³ØªØ²Ø±Ø§Ø¹ Ø§Ù„Ø³Ù…ÙƒÙŠ)
  @Column()
  name: string;

  // Short unique code used in headers / subdomains (e.g. alamal)
  @Column({ unique: true })
  code: string;

  @Column({ default: 'active' })
  status: string; // active, suspended, deleted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Farm, (farm) => farm.tenant)
  farms: Farm[];

  @OneToMany(() => Pond, (pond) => pond.tenant)
  ponds: Pond[];
}
