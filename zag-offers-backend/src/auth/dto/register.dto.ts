import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'رقم الموبايل', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'كلمة السر (6 أرقام على الأقل)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'الاسم بالكامل', example: 'أحمد محمد' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
