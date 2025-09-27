import { IsUUID, IsString, IsInt, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateFishBatchDto {
  @IsString()
  batchNumber: string;

  @IsString()
  species: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsInt()
  initialCount: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  averageWeight: number; // grams

  @IsUUID()
  pondId: string;

  @IsOptional()
  @IsDateString()
  stockingDate?: string;

  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;
}
