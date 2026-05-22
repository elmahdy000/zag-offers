import { Injectable } from '@nestjs/common';
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

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async addPoints(userId: string, amount: number, reason: string): Promise<User> {
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
        const nextTierThresh = newTier === 'BRONZE' ? 500 : newTier === 'SILVER' ? 2000 : newTier === 'GOLD' ? 5000 : Infinity;
        if (nextTierThresh !== Infinity && newPoints >= nextTierThresh - 50 && user.points < nextTierThresh - 50) {
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
        const referrer = await tx.user.findUnique({ where: { id: user.referredById } });
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
