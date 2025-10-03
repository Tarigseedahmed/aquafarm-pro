import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcknowledgeAlertDto {
  @ApiProperty({ description: 'Optional acknowledgment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
