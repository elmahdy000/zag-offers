import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { facebookId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { stores: { select: { id: true } } },
    });
    if (!user) return { message: 'Account already deleted' };
    if (user.role === 'ADMIN') {
      throw new BadRequestException(
        'Administrator accounts must be removed by another authorized administrator',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const storeIds = user.stores.map((store) => store.id);
      if (storeIds.length > 0) {
        const offers = await tx.offer.findMany({
          where: { storeId: { in: storeIds } },
          select: { id: true },
        });
        const offerIds = offers.map((offer) => offer.id);

        if (offerIds.length > 0) {
          await tx.banner.updateMany({
            where: { offerId: { in: offerIds } },
            data: { offerId: null },
          });
          await tx.analyticsEvent.deleteMany({
            where: { offerId: { in: offerIds } },
          });
          await tx.favorite.deleteMany({
            where: { offerId: { in: offerIds } },
          });
          await tx.coupon.deleteMany({ where: { offerId: { in: offerIds } } });
          await tx.review.deleteMany({ where: { offerId: { in: offerIds } } });
          await tx.offer.deleteMany({ where: { id: { in: offerIds } } });
        }

        await tx.analyticsEvent.deleteMany({
          where: { storeId: { in: storeIds } },
        });
        await tx.review.deleteMany({ where: { storeId: { in: storeIds } } });
        await tx.store.deleteMany({ where: { ownerId: id } });
      }

      const conversations = await tx.conversation.findMany({
        where: { OR: [{ participantId: id }, { adminId: id }] },
        select: { id: true },
      });
      const conversationIds = conversations.map(
        (conversation) => conversation.id,
      );
      if (conversationIds.length > 0) {
        await tx.message.deleteMany({
          where: { conversationId: { in: conversationIds } },
        });
        await tx.conversation.deleteMany({
          where: { id: { in: conversationIds } },
        });
      }

      await tx.message.deleteMany({ where: { senderId: id } });
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { customerId: id } });
      await tx.coupon.deleteMany({ where: { customerId: id } });
      await tx.analyticsEvent.deleteMany({ where: { userId: id } });
      await tx.user.updateMany({
        where: { referredById: id },
        data: { referredById: null },
      });
      await tx.user.delete({ where: { id } });
    });

    return { message: 'Account and associated data deleted successfully' };
  }

  async addPoints(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newPoints = user.points + amount;

    let newTier: any = 'BRONZE';
    if (newPoints >= 5000) newTier = 'PLATINUM';
    else if (newPoints >= 2000) newTier = 'GOLD';
    else if (newPoints >= 500) newTier = 'SILVER';

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await (tx as any).pointLog.create({
        data: {
          userId,
          amount,
          reason,
        },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          points: newPoints,
          tier: newTier,
        },
      });

      // Gamification Notifications
      if (newTier !== user.tier) {
        await (tx as any).notification.create({
          data: {
            userId,
            title: 'ترقية المستوى! 🌟',
            body: `تهانينا! لقد وصلت إلى المستوى ${newTier}. استمتع بمزايا إضافية.`,
            type: 'TIER_UP',
          },
        });
      } else {
        const nextTierThresh =
          newTier === 'BRONZE'
            ? 500
            : newTier === 'SILVER'
              ? 2000
              : newTier === 'GOLD'
                ? 5000
                : Infinity;
        if (
          nextTierThresh !== Infinity &&
          newPoints >= nextTierThresh - 50 &&
          user.points < nextTierThresh - 50
        ) {
          // Only notify the FIRST time they cross the (Threshold - 50) mark to prevent spam
          await (tx as any).notification.create({
            data: {
              userId,
              title: 'أنت قريب جداً! 🎯',
              body: `أنت على بُعد ${nextTierThresh - newPoints} نقطة فقط من الوصول لمستوى أعلى! استمر في استكشاف العروض.`,
              type: 'SYSTEM',
            },
          });
        }
      }

      // Referral Reward Logic
      if (!user.hasRewardedReferrer && user.referredById && amount > 0) {
        const referrer = await tx.user.findUnique({
          where: { id: user.referredById },
        });
        if (referrer) {
          const referrerNewPoints = referrer.points + 100;
          let referrerNewTier: any = 'BRONZE';
          if (referrerNewPoints >= 5000) referrerNewTier = 'PLATINUM';
          else if (referrerNewPoints >= 2000) referrerNewTier = 'GOLD';
          else if (referrerNewPoints >= 500) referrerNewTier = 'SILVER';

          await tx.user.update({
            where: { id: referrer.id },
            data: {
              points: referrerNewPoints,
              tier: referrerNewTier,
            },
          });

          await (tx as any).pointLog.create({
            data: {
              userId: referrer.id,
              amount: 100,
              reason: `REFERRAL_BONUS: ${user.name || 'صديقك'}`,
            },
          });

          // Also set hasRewardedReferrer to true for the current user
          await tx.user.update({
            where: { id: userId },
            data: {
              hasRewardedReferrer: true,
            },
          });

          // Send Notification
          await (tx as any).notification.create({
            data: {
              userId: referrer.id,
              title: 'كسبت 100 نقطة! 🎉',
              body: `صديقك ${user.name || ''} استخدم التطبيق وحصلت على مكافأة الدعوة.`,
              type: 'SYSTEM',
            },
          });
        }
      }

      return updated;
    });

    return updatedUser;
  }

  async getPointTransactions(userId: string) {
    return (this.prisma as any).pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
