import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, StoreStatus } from '@prisma/client';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendedOffers(userId: string) {
    // 1. جلب بيانات المستخدم والمفضلة بتاعته
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          include: {
            offer: {
              include: {
                store: true,
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    // 2. استخراج التصنيفات اللي اليوزر مهتم بيها من المفضلة
    const interestCategoryIds = [
      ...new Set(user.favorites.map((f) => f.offer.store.categoryId)),
    ];

    // 3. البحث عن عروض مشابهة (نفس التصنيف أو نفس المنطقة)
    // بنستبعد العروض اللي هو حطها فعلاً في المفضلة
    const favoritedOfferIds = user.favorites.map((f) => f.offerId);

    return this.prisma.offer.findMany({
      where: {
        status: OfferStatus.ACTIVE,
        id: { notIn: favoritedOfferIds },
        OR: [
          { store: { categoryId: { in: interestCategoryIds } } },
          { store: { area: user.area } },
        ],
      },
      select: {
        id: true,
        title: true,
        discount: true,
        endDate: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            area: true,
            category: { select: { name: true } },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrendingOffers() {
    return this.prisma.offer.findMany({
      where: {
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED },
      },
      select: {
        id: true,
        title: true,
        discount: true,
        endDate: true,
        store: {
          select: {
            name: true,
            logo: true,
            area: true,
          },
        },
        _count: {
          select: { coupons: true },
        },
      },
      orderBy: {
        coupons: {
          _count: 'desc',
        },
      },
      take: 10,
    });
  }
}
