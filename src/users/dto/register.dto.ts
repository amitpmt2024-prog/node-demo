import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
