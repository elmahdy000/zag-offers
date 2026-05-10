import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'رقم الموبايل', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^01[0-2,5]\d{8}$/, { message: 'رقم الموبايل غير صحيح' })
  @MaxLength(11)
  phone: string;

  @ApiProperty({ description: 'كلمة السر', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}
