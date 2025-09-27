import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fx_rates')
@Index(['baseCurrency', 'quoteCurrency', 'effectiveDate'], { unique: true })
export class FxRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 3 })
  baseCurrency: string;

  @Column({ length: 3 })
  quoteCurrency: string;

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  rate: string; // decimal string

  @Column({ length: 32, default: 'MANUAL' })
  source: string; // MANUAL | ECB | OPENEXCHANGE | OTHER

  @Column({ type: 'date' })
  effectiveDate: string; // date the rate applies

  @Column({ type: 'timestamptz', nullable: true })
  retrievedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
