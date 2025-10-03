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
  baseCurrency: string; // e.g. USD

  @Column({ length: 3 })
  quoteCurrency: string; // e.g. SAR

  // Store as numeric in DB but always expose as a 4-decimal string (pads/truncates) for
  // deterministic formatting across SQLite (which normalizes numeric values) and Postgres.
  @Column({
    type: 'numeric',
    precision: 18,
    scale: 8,
    transformer: {
      to: (value: string | number) => value,
      from: (value: any) => {
        if (value === null || value === undefined) return value;
        const str = typeof value === 'number' ? value.toString() : String(value);
        if (!str.includes('.')) return str + '.0000';
        const [intPart, fracPartRaw] = str.split('.');
        const fracPart = (fracPartRaw + '0000').slice(0, 4); // target 4-decimal display
        return `${intPart}.${fracPart}`;
      },
    },
  })
  rate: string; // normalized to exactly 4 decimal places when read

  @Column({ length: 32, default: 'MANUAL' })
  source: string; // MANUAL | ECB | OPENEXCHANGE | OTHER

  @Column({ type: 'date' })
  effectiveDate: string; // date the rate applies

  // Use 'timestamp' for PostgreSQL compatibility
  @Column({ type: 'timestamp', nullable: true })
  retrievedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
