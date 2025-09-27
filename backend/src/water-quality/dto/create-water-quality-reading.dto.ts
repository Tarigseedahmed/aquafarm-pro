import { IsNumber, IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWaterQualityReadingDto {
  @IsNumber()
  @Type(() => Number)
  temperature: number;

  @IsNumber()
  @Type(() => Number)
  ph: number;

  @IsNumber()
  @Type(() => Number)
  dissolvedOxygen: number;

  @IsNumber()
  @Type(() => Number)
  ammonia: number;

  @IsNumber()
  @Type(() => Number)
  nitrite: number;

  @IsNumber()
  @Type(() => Number)
  nitrate: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salinity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  turbidity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  alkalinity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hardness?: number;

  @IsOptional()
  @IsString()
  readingMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alerts?: string[];

  @IsUUID()
  pondId: string;

  // recordedById is injected from the authenticated user in the controller, so it
  // should not be required from the client payload.
  @IsOptional()
  @IsUUID()
  recordedById?: string;
}
