import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'رقم الموبايل أو البريد الإلكتروني', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  phone: string;

  @ApiProperty({ description: 'كلمة السر', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}
