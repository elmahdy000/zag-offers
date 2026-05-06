import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendNotificationToUserDto } from './dto/send-notification-to-user.dto';
import { SendNotificationToUsersDto } from './dto/send-notification-to-users.dto';

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
      'يُسجل التوكن في DB ويُشترك تلقائياً في topics المنطقة وall_users',
  })
  @ApiBody({ type: RegisterFcmTokenDto })
  async registerToken(
    @Request() req: { user: { id: string } },
    @Body() body: RegisterFcmTokenDto,
  ) {
    await this.notificationsService.saveFcmToken(req.user.id, body.fcmToken);
    return { success: true, message: 'تم تسجيل توكن الإشعارات بنجاح' };
  }

  @Delete('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'إلغاء تسجيل توكن الإشعارات (عند تسجيل الخروج)',
    description: 'يُلغى الاشتراك في كل الـ Topics ويُحذف التوكن من DB',
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

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على إشعارات المستخدم الحالي' })
  async getMyNotifications(@Request() req: { user: { id: string } }) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديد إشعار كمقروء' })
  async markNotificationAsRead(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markNotificationAsRead(req.user.id, id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديد كافة إشعارات المستخدم كمقروءة' })
  async markAllNotificationsAsRead(@Request() req: { user: { id: string } }) {
    return this.notificationsService.markAllNotificationsAsRead(req.user.id);
  }

  @Post('test/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال إشعار تجريبي للمستخدم الحالي' })
  @ApiBody({ type: SendNotificationDto })
  async sendTestToMe(
    @Request() req: { user: { id: string } },
    @Body() body: SendNotificationDto,
  ) {
    await this.notificationsService.sendToUserId(req.user.id, {
      title: body.title,
      body: body.body,
      data: body.data,
      imageUrl: body.imageUrl,
    });
    return {
      success: true,
      message: 'Test notification sent (if token exists)',
    };
  }

  @Post('test/public')
  @ApiOperation({ summary: 'إرسال إشعار للجميع لاختبار النظام' })
  @ApiBody({ type: SendNotificationDto })
  async sendTestPublic(@Body() body: SendNotificationDto) {
    await this.notificationsService.sendToAll(
      body.title,
      body.body,
      body.data,
      body.imageUrl,
    );
    return {
      success: true,
      message: 'Public test broadcast triggered',
    };
  }

  @Post('admin/send-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال إشعار لمستخدم محدد (Admin)' })
  @ApiBody({ type: SendNotificationToUserDto })
  async sendToUserByAdmin(@Body() body: SendNotificationToUserDto) {
    await this.notificationsService.sendToUserId(body.userId, {
      title: body.title,
      body: body.body,
      data: body.data,
      imageUrl: body.imageUrl,
    });
    return { success: true, message: 'Notification processed for target user' };
  }

  @Post('admin/send-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال إشعار لمجموعة مستخدمين (Admin)' })
  @ApiBody({ type: SendNotificationToUsersDto })
  async sendToUsersByAdmin(@Body() body: SendNotificationToUsersDto) {
    const result = await this.notificationsService.sendToUserIds(body.userIds, {
      title: body.title,
      body: body.body,
      data: body.data,
      imageUrl: body.imageUrl,
    });

    return {
      success: true,
      message: 'Bulk notification processed',
      ...result,
    };
  }
}
