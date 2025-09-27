import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenancy/entities/tenant.entity';

@Entity('notifications')
@Index('IDX_notifications_tenant_user_createdAt', ['tenantId', 'userId', 'createdAt'])
@Index('IDX_notifications_tenant_user_isRead', ['tenantId', 'userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: 'info' })
  type: string; // info, warning, error, success

  @Column({ default: 'water_quality' })
  category: string; // water_quality, fish_health, system, maintenance, feeding

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 'low' })
  priority: string; // low, medium, high, critical

  @Column('json', { nullable: true })
  data?: any; // Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ø«Ù„ Ù…Ø¹Ø±Ù Ø§Ù„Ø­ÙˆØ¶ Ø£Ùˆ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©

  @Column('json', { nullable: true })
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];

  @Column({ nullable: true })
  sourceType?: string; // pond, farm, fish_batch, water_reading

  @Column({ nullable: true })
  sourceId?: string;

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Multi-tenancy
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
