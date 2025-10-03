import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePondDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  area: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  depth: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  volume?: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  maxCapacity: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  currentStockCount?: number;

  @IsOptional()
  @IsString()
  shape?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  equipment?: string[];

  @IsOptional()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsUUID()
  farmId: string;
}
