import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, CouponStatus } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // تشغيل المهمة كل يوم الساعة 2 ظهراً (14:00) والساعة 8 مساءً (20:00)
  @Cron('0 14,20 * * *')
  async sendDailyDigest() {
    this.logger.debug('Running daily digest task...');
    try {
      // البحث عن العروض النشطة التي لم يرسل لها إشعار بعد
      const unnotifiedOffers = await this.prisma.offer.findMany({
        where: {
          status: OfferStatus.ACTIVE,
          isNotified: false,
        },
        include: { store: true },
      });

      if (unnotifiedOffers.length > 0) {
        this.logger.log(
          `Found ${unnotifiedOffers.length} unnotified offers. Sending digest...`,
        );

        // أخذ أمثلة على أسماء المحلات للعرض في الإشعار
        const storeNames = Array.from(
          new Set(unnotifiedOffers.map((o) => o.store.name)),
        );
        const storeSample = storeNames.slice(0, 2).join(' و ');
        const moreText = storeNames.length > 2 ? ' ومحلات أخرى' : '';

        await this.notifications.sendToAll(
          `🔥 ${unnotifiedOffers.length} عروض جديدة في الزقازيق!`,
          `${storeSample}${moreText} نزلوا عروض جديدة.. تصفحها الآن! 🚀`,
          { type: 'DIGEST_NEW_OFFERS' },
        );

        // تحديث حالة العروض لتصبح notified
        await this.prisma.offer.updateMany({
          where: { id: { in: unnotifiedOffers.map((o) => o.id) } },
          data: { isNotified: true },
        });

        this.logger.log('Daily digest sent successfully.');
      }
    } catch (error) {
      this.logger.error('Failed to send daily digest:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running system cleanup tasks...');
    try {
      // 1. Expire Offers that passed their end date
      const expiredOffers = await this.prisma.offer.updateMany({
        where: {
          status: { in: [OfferStatus.ACTIVE, OfferStatus.PENDING] },
          endDate: { lt: new Date() },
        },
        data: { status: OfferStatus.EXPIRED },
      });
      if (expiredOffers.count > 0) {
        this.logger.log(`Automatically expired ${expiredOffers.count} offers.`);
      }

      // 2. Expire Coupons that passed their window
      const expiredCoupons = await this.prisma.coupon.updateMany({
        where: {
          status: CouponStatus.GENERATED,
          expiresAt: { lt: new Date() },
        },
        data: { status: CouponStatus.EXPIRED },
      });
      if (expiredCoupons.count > 0) {
        this.logger.log(
          `Automatically expired ${expiredCoupons.count} coupons.`,
        );
      }
    } catch (error) {
      this.logger.error('Cron job failed:', error);
    }
  }
}
