import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { SendNotificationDto } from './send-notification.dto';

export class SendNotificationToUsersDto extends SendNotificationDto {
  @ApiProperty({
    type: [String],
    example: ['uuid-user-1', 'uuid-user-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds: string[];
}
