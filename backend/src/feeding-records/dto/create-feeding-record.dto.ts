import { IsUUID, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateFeedingRecordDto {
  @IsUUID()
  fishBatchId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  feedAmount: number; // kg

  @IsString()
  feedType: string;

  @IsOptional()
  @IsString()
  feedBrand?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  proteinPercentage?: number;

  @IsOptional()
  @IsString()
  feedingMethod?: string;

  @IsString()
  feedingTime: string; // HH:mm:ss

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  waterTemperature?: number;

  @IsOptional()
  @IsString()
  weatherConditions?: string;

  @IsOptional()
  @IsString()
  fishAppetite?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  cost?: number;
}
