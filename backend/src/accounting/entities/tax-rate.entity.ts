import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tax_rates')
@Index(['tenantId', 'code', 'validFrom'], { unique: true })
export class TaxRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @Column({ length: 32 })
  code: string; // e.g. VAT_STANDARD, VAT_REDUCED

  @Column({ length: 128, nullable: true })
  description?: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 4 })
  ratePercent: string; // stored as decimal string to avoid FP issues

  @Column({ type: 'date' })
  validFrom: string;

  @Column({ type: 'date', nullable: true })
  validTo?: string | null;

  @Column({ default: false })
  isCompound: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
