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
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running system cleanup tasks...');
    try {
      // 1. Expire Offers that passed their end date and notify merchants
      const offersToExpire = await this.prisma.offer.findMany({
        where: {
          status: { in: [OfferStatus.ACTIVE, OfferStatus.PENDING] },
          endDate: { lt: new Date() },
        },
        include: {
          store: {
            select: {
              ownerId: true,
              name: true,
            },
          },
        },
      });

      if (offersToExpire.length > 0) {
        const offerIds = offersToExpire.map((o) => o.id);
        await this.prisma.offer.updateMany({
          where: { id: { in: offerIds } },
          data: { status: OfferStatus.EXPIRED },
        });

        this.logger.log(`Automatically expired ${offersToExpire.length} offers.`);

        for (const offer of offersToExpire) {
          if (offer.store?.ownerId) {
            void this.notificationsService
              .sendToUserId(offer.store.ownerId, {
                title: 'انتهت صلاحية العرض ⏳',
                body: `انتهت فترة صلاحية عرضك "${offer.title}" التابع لمتجر "${offer.store.name}".`,
                data: { offerId: offer.id, type: 'OFFER_EXPIRED' },
              })
              .catch((err) =>
                this.logger.error(
                  `Failed to send expiration notification to user ${offer.store.ownerId}:`,
                  err,
                ),
              );
          }
        }
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
