import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM Registration Token from Firebase SDK',
    example: 'fGH8k2m...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  fcmToken: string;
}
