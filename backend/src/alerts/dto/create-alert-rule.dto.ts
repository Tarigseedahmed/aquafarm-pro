import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AlertConditionDto {
  @ApiProperty({ description: 'Parameter name (temperature, ph, dissolvedOxygen, etc.)' })
  @IsString()
  parameter: string;

  @ApiProperty({
    description: 'Comparison operator',
    enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between'],
  })
  @IsEnum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between'])
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between';

  @ApiProperty({ description: 'Threshold value or range for between operator' })
  value: number | [number, number];

  @ApiProperty({ description: 'Unit of measurement', required: false })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateAlertRuleDto {
  @ApiProperty({ description: 'Alert rule name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Alert rule description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Pond ID (null for global rules)', required: false })
  @IsOptional()
  @IsUUID()
  pondId?: string;

  @ApiProperty({ description: 'Alert conditions', type: [AlertConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertConditionDto)
  conditions: AlertConditionDto[];

  @ApiProperty({ description: 'Alert severity', enum: ['info', 'warning', 'critical'] })
  @IsEnum(['info', 'warning', 'critical'])
  severity: 'info' | 'warning' | 'critical';

  @ApiProperty({ description: 'Whether rule is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Cooldown period in minutes', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  cooldownMinutes?: number;

  @ApiProperty({ description: 'Notification channels', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationChannels?: string[];

  @ApiProperty({ description: 'Custom alert message', required: false })
  @IsOptional()
  @IsString()
  customMessage?: string;
}
