import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, CouponStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

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
