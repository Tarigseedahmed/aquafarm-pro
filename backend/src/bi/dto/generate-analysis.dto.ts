import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateAnalysisDto {
  @ApiProperty({ description: 'Start date for analysis (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for analysis (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Farm ID to analyze (optional)', required: false })
  @IsOptional()
  @IsUUID()
  farmId?: string;

  @ApiProperty({ description: 'Pond ID to analyze (optional)', required: false })
  @IsOptional()
  @IsUUID()
  pondId?: string;
}
