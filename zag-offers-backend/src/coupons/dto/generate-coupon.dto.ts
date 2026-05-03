import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateCouponDto {
  @ApiProperty({
    description: 'معرف العرض (Offer ID)',
    example: 'uuid-of-offer',
  })
  @IsNotEmpty()
  @IsString()
  offerId: string;
}
