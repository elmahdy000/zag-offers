import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'رقم الموبايل', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'كلمة السر', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
