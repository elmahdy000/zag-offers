import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SendNotificationDto } from './send-notification.dto';

export class SendNotificationToUserDto extends SendNotificationDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
