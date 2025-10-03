import { IsNumber, IsString, IsOptional, IsUUID, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWaterQualityReadingDto {
  @IsNumber()
  @Min(0, { message: 'Temperature cannot be negative' })
  @Max(50, { message: 'Temperature cannot exceed 50°C' })
  @ApiProperty({ description: 'Water temperature in Celsius', minimum: 0, maximum: 50 })
  temperature: number;

  @IsNumber()
  @Min(0, { message: 'pH cannot be negative' })
  @Max(14, { message: 'pH cannot exceed 14' })
  @ApiProperty({ description: 'pH level (0-14)', minimum: 0, maximum: 14 })
  ph: number;

  @IsNumber()
  @Min(0, { message: 'Dissolved oxygen cannot be negative' })
  @Max(20, { message: 'Dissolved oxygen cannot exceed 20 mg/L' })
  @ApiProperty({ description: 'Dissolved oxygen in mg/L', minimum: 0, maximum: 20 })
  dissolvedOxygen: number;

  @IsNumber()
  @Min(0, { message: 'Ammonia cannot be negative' })
  @Max(10, { message: 'Ammonia cannot exceed 10 mg/L' })
  @ApiProperty({ description: 'Ammonia level in mg/L', minimum: 0, maximum: 10 })
  ammonia: number;

  @IsNumber()
  @Min(0, { message: 'Nitrite cannot be negative' })
  @Max(10, { message: 'Nitrite cannot exceed 10 mg/L' })
  @ApiProperty({ description: 'Nitrite level in mg/L', minimum: 0, maximum: 10 })
  nitrite: number;

  @IsNumber()
  @Min(0, { message: 'Nitrate cannot be negative' })
  @Max(100, { message: 'Nitrate cannot exceed 100 mg/L' })
  @ApiProperty({ description: 'Nitrate level in mg/L', minimum: 0, maximum: 100 })
  nitrate: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Salinity cannot be negative' })
  @Max(50, { message: 'Salinity cannot exceed 50 ppt' })
  @ApiPropertyOptional({ description: 'Salinity in parts per thousand', minimum: 0, maximum: 50 })
  salinity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Turbidity cannot be negative' })
  @Max(1000, { message: 'Turbidity cannot exceed 1000 NTU' })
  @ApiPropertyOptional({ description: 'Turbidity in NTU', minimum: 0, maximum: 1000 })
  turbidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Alkalinity cannot be negative' })
  @Max(500, { message: 'Alkalinity cannot exceed 500 mg/L' })
  @ApiPropertyOptional({ description: 'Alkalinity in mg/L', minimum: 0, maximum: 500 })
  alkalinity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Hardness cannot be negative' })
  @Max(1000, { message: 'Hardness cannot exceed 1000 mg/L' })
  @ApiPropertyOptional({ description: 'Water hardness in mg/L', minimum: 0, maximum: 1000 })
  hardness?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reading method: manual, sensor, laboratory' })
  readingMethod?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Status: normal, warning, critical' })
  status?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Device ID if reading from IoT sensor' })
  deviceId?: string;

  @IsUUID()
  @ApiProperty({ description: 'Pond ID' })
  pondId: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'User ID who recorded the reading' })
  recordedById?: string;
}
