import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFarmDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalArea?: number;

  @IsString()
  farmType: string; // marine, freshwater, brackish

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
