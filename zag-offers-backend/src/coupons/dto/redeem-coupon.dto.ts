import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RedeemCouponDto {
  @ApiProperty({
    description: 'كود الكوبون',
    example: 'ZAG-X7Y2Z',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'معرف المتجر (اختياري - يُستنتج من التاجر إن لم يُرسل)',
    example: 'uuid-of-store',
  })
  @IsOptional()
  @IsString()
  storeId?: string;
}
