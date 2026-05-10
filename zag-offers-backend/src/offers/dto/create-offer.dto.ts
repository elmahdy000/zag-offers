import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
  IsDateString,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({
    description: 'عنوان العرض',
    example: 'خصم 20% على جميع الوجبات',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'تفاصيل العرض',
    example: 'العرض ساري على جميع طلبات الصالة فقط',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'روابط صور العرض',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'نسبة الخصم أو نوع العرض', example: '20%' })
  @IsNotEmpty()
  @IsString()
  discount: string;

  @ApiProperty({
    required: false,
    description: 'شروط وأحكام العرض',
    example: 'لا يمكن دمج العرض مع خصومات أخرى',
  })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ description: 'تاريخ بدء العرض', example: '2026-05-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'تاريخ انتهاء العرض', example: '2026-06-01' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    required: false,
    description: 'الحد الأقصى لاستخدام الكوبون لكل عميل',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiProperty({
    description: 'معرف المحل (Store ID)',
    example: 'uuid-of-store',
    required: false,
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({
    description: 'السعر الأصلي',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;
}
