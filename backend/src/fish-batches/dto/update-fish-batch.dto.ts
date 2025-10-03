import { PartialType } from '@nestjs/mapped-types';
import { CreateFishBatchDto } from './create-fish-batch.dto';
import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';

export class UpdateFishBatchDto extends PartialType(CreateFishBatchDto) {
  @IsOptional()
  @IsString()
  status?: string; // active, harvested, archived

  @IsOptional()
  @IsInt()
  currentCount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  totalBiomass?: number;
}
