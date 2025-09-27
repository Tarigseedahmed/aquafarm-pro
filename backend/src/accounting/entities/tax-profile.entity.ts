import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tax_profiles')
@Index(['tenantId', 'countryCode'], { unique: true })
export class TaxProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @Column({ length: 2 })
  countryCode: string; // ISO 3166-1 alpha-2

  @Column({ length: 64 })
  taxIdNumber: string;

  @Column({ length: 64, nullable: true })
  regime?: string | null; // e.g. STANDARD, SIMPLIFIED

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
