import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum FarmStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('farms')
export class TestFarm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 500 })
  location?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'int', nullable: true })
  area?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FarmStatus,
    default: FarmStatus.ACTIVE,
  })
  status: FarmStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// DTO for creating farms
export class CreateTestFarmDto {
  @IsNotEmpty({ message: 'Farm name is required' })
  @IsString()
  @MinLength(2, { message: 'Farm name must be at least 2 characters' })
  @MaxLength(255, { message: 'Farm name cannot exceed 255 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Location cannot exceed 500 characters' })
  location?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  longitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Area must be a valid number' })
  area?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// DTO for updating farms
export class UpdateTestFarmDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Farm name must be at least 2 characters' })
  @MaxLength(255, { message: 'Farm name cannot exceed 255 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Location cannot exceed 500 characters' })
  location?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  longitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Area must be a valid number' })
  area?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FarmStatus, { message: 'Status must be active, inactive, or maintenance' })
  status?: FarmStatus;
}
