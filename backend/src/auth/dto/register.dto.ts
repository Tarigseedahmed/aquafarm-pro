import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { IsValidEmail, IsStrongPassword, IsValidPhone } from '../../common/validation/validation.decorators';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsValidEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  role?: string = 'user';

  @IsString()
  @IsOptional()
  company?: string;

  @IsValidPhone()
  @IsOptional()
  phone?: string;
}
