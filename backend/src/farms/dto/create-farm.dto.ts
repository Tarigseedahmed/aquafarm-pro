import { IsString, IsOptional, IsNumber, IsArray, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidPhone, IsPositiveNumber } from '../../common/validation/validation.decorators';

export class CreateFarmDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsPositiveNumber()
  @Type(() => Number)
  totalArea?: number;

  @IsEnum(['marine', 'freshwater', 'brackish'])
  farmType: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @IsOptional()
  @IsValidPhone()
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
