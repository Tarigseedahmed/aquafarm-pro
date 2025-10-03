import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveAlertDto {
  @ApiProperty({
    description: 'Resolution notes explaining how the alert was resolved',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
