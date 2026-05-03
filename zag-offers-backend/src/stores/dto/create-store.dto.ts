import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ description: 'اسم المحل', example: 'مطعم البرنس' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    required: false,
    description: 'رابط اللوجو',
    example: 'https://image.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    required: false,
    description: 'صورة الغلاف',
    example: 'https://image.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    description: 'العنوان بالتفصيل',
    example: 'شارع القومية، بجوار صيدلية علي',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ required: false, description: 'المنطقة', example: 'القومية' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({
    required: false,
    description: 'خط العرض (Latitude)',
    example: 30.5877,
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({
    required: false,
    description: 'خط الطول (Longitude)',
    example: 31.502,
  })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ description: 'رقم التليفون', example: '01012345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    required: false,
    description: 'رقم الواتساب',
    example: '01012345678',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({
    description: 'معرف القسم (Category ID)',
    example: 'uuid-of-category',
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;
}
