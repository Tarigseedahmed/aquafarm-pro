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
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
@Index('IDX_notifications_tenant_user_createdAt', ['tenantId', 'userId', 'createdAt'])
@Index('IDX_notifications_tenant_user_isRead', ['tenantId', 'userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column('text')
  message: string;

  @ApiProperty({ default: 'info' })
  @Column({ default: 'info' })
  type: string; // info, warning, error, success

  @ApiProperty({ default: 'water_quality' })
  @Column({ default: 'water_quality' })
  category: string; // water_quality, fish_health, system, maintenance, feeding

  @ApiProperty({ default: false })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ default: 'low' })
  @Column({ default: 'low' })
  priority: string; // low, medium, high, critical

  @ApiProperty({ required: false, description: 'Additional contextual data' })
  @Column('json', { nullable: true })
  data?: any; // Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ø«Ù„ Ù…Ø¹Ø±Ù Ø§Ù„Ø­ÙˆØ¶ Ø£Ùˆ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©

  @ApiProperty({
    required: false,
    description: 'Suggested user actions',
    type: () => [Object],
  })
  @Column('json', { nullable: true })
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  sourceType?: string; // pond, farm, fish_batch, water_reading

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  sourceId?: string;

  // Ø¹Ù„Ø§Ù‚Ø§Øª
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  // Multi-tenancy
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
