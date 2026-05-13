import { ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'خصم 20% على جميع المنتجات' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'العرض سارٍ لمدة أسبوع' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '20%' })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiPropertyOptional({ example: 'لا يُجمع مع عروض أخرى' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  usageLimit?: number | null;

  @ApiPropertyOptional({ enum: OfferStatus, example: OfferStatus.PENDING })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @ApiPropertyOptional({ example: 'store-uuid' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Absolute image URLs only',
    example: ['https://cdn.example.com/offers/1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsUrl(
    { require_tld: false, require_protocol: true },
    { each: true, message: 'Each image must be a valid absolute URL' },
  )
  images?: string[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;
}
