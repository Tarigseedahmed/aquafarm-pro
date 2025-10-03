import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  entity: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 20 })
  action: 'insert' | 'update' | 'remove';

  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'simple-json', nullable: true })
  before: any | null;

  @Column({ type: 'simple-json', nullable: true })
  after: any | null;

  @Column({ type: 'simple-json', nullable: true })
  changedKeys: string[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
