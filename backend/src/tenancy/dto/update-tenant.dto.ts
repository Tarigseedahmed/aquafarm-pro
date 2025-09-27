import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]{2,30}$/)
  code?: string;

  @IsString()
  @IsOptional()
  status?: string; // active, suspended, deleted
}
