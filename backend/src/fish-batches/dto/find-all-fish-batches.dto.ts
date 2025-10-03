import { IsOptional, IsUUID, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllFishBatchesDto {
  @IsOptional()
  @IsUUID()
  pondId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // batchNumber or species

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
