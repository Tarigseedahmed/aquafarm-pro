import { IsOptional, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllFeedingRecordsDto {
  @IsOptional()
  @IsUUID()
  fishBatchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
