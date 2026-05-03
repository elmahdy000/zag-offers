import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('notifications (الإشعارات)')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'تسجيل توكن الإشعارات للجهاز',
    description:
      'يُسجَّل التوكن في DB ويُشترك تلقائياً في topics المنطقة وall_users',
  })
  @ApiBody({
    schema: {
      required: ['fcmToken'],
      properties: {
        fcmToken: {
          type: 'string',
          example: 'fGH8k2m...',
          description: 'FCM Registration Token من Firebase SDK',
        },
      },
    },
  })
  async registerToken(
    @Request() req: { user: { id: string } },
    @Body('fcmToken') fcmToken: string,
  ) {
    await this.notificationsService.saveFcmToken(req.user.id, fcmToken);
    return { success: true, message: 'تم تسجيل توكن الإشعارات بنجاح' };
  }

  @Delete('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'إلغاء تسجيل توكن الإشعارات (عند تسجيل الخروج)',
    description: 'يُلغَى الاشتراك في كل الـ Topics ويُحذف التوكن من DB',
  })
  async removeToken(@Request() req: { user: { id: string } }) {
    await this.notificationsService.removeFcmToken(req.user.id);
    return { success: true, message: 'تم إلغاء تسجيل الإشعارات' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حالة Firebase Admin SDK (للأدمن فقط)' })
  getStatus() {
    return {
      firebaseReady: this.notificationsService.isReady(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال إشعار تجريبي (للأدمن فقط)' })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string', example: 'اختبار الإشعارات' },
        body: { type: 'string', example: 'هذا إشعار تجريبي من لوحة التحكم' },
        area: {
          type: 'string',
          example: 'القومية',
          description: 'فارغ = كل المستخدمين',
        },
      },
    },
  })
  async sendTest(
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('area') area?: string,
  ) {
    if (area) {
      await this.notificationsService.sendToArea(area, title, body, {
        type: 'TEST',
      });
    } else {
      await this.notificationsService.sendToAll(title, body, { type: 'TEST' });
    }
    return { success: true, message: 'تم إرسال الإشعار التجريبي' };
  }
}
