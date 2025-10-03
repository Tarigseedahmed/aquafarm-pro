import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('invoice_series')
@Index(['tenantId', 'prefix'], { unique: true })
export class InvoiceSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @Column({ length: 16 })
  prefix: string; // e.g. INV-2025-

  @Column({ type: 'int', default: 0 })
  currentNumber: number;

  @Column({ type: 'int', default: 6 })
  padding: number; // zero pad length

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
