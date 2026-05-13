import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'رقم الموبايل', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^01[0-2,5]\d{8}$/, { message: 'رقم الموبايل غير صحيح' })
  @MaxLength(11)
  phone: string;

  @ApiProperty({
    description: 'كلمة السر (6 أرقام على الأقل)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  @MinLength(6, {
    message: 'كلمة السر يجب أن تحتوي على 6 أرقام أو حروف على الأقل',
  })
  password: string;

  @ApiProperty({ description: 'الاسم بالكامل', example: 'أحمد محمد' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\u0600-\u06FF\sa-zA-Z]+$/, {
    message: 'الاسم يجب أن يحتوي على حروف فقط',
  })
  name: string;

  @ApiProperty({
    description: 'البريد الإلكتروني',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
