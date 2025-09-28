import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ example: 'info' })
  type: string;

  @ApiProperty({ example: 'water_quality' })
  category: string;

  @ApiProperty({ default: false })
  isRead: boolean;

  @ApiProperty({ example: 'low' })
  priority: string;

  @ApiProperty({ required: false, description: 'Arbitrary contextual data' })
  data?: any;

  @ApiProperty({ required: false, description: 'Suggested user action buttons' })
  actions?: { label: string; action: string; url?: string }[];

  @ApiProperty({ required: false })
  sourceType?: string;

  @ApiProperty({ required: false })
  sourceId?: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string | Date;

  @ApiProperty({ required: false, format: 'uuid' })
  tenantId?: string;
}
