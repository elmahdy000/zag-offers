import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, StoreStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  async getRecommendedOffers(userId?: string) {
    // 1. إذا كان زائر، نعرض له التريند
    if (!userId) {
      return this.getTrendingOffers();
    }

    // 2. محاولة جلب الترشيحات من الكاش أولاً (Redis) لتوفير الأداء
    const cacheKey = `user_rec_${userId}`;
    try {
      // @ts-ignore
      const cached = await this.prisma.cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // نتابع لو الكاش فشل
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return this.getTrendingOffers();

    // 3. حساب اهتمامات المستخدم
    const interests = await this.analyticsService.getUserInterests(userId);
    const { categoryWeights, areaWeights } = interests;

    if (user.area && !areaWeights[user.area]) {
      areaWeights[user.area] = 3;
    }

    const hasInterests =
      Object.keys(categoryWeights).length > 0 ||
      Object.keys(areaWeights).length > 0;

    if (!hasInterests) {
      return this.getTrendingOffers();
    }

    // 4. جلب pool من العروض النشطة
    const pool = await this.prisma.offer.findMany({
      where: {
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED },
      },
      include: {
        store: {
          include: { category: true }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // 5. نظام النقاط
    const scoredOffers = pool.map((offer) => {
      let score = 0;
      const catId = offer.store.categoryId;
      const area = offer.store.area;

      if (categoryWeights[catId]) score += categoryWeights[catId] * 2.5;
      if (area && areaWeights[area]) score += areaWeights[area] * 1.5;
      
      const hoursSinceCreated = (Date.now() - new Date(offer.createdAt).getTime()) / 3600000;
      if (hoursSinceCreated < 24) score += 2;

      return { ...offer, _score: score };
    });

    scoredOffers.sort((a, b) => b._score - a._score);
    const result = scoredOffers.slice(0, 10).map(({ _score, ...offer }) => offer);

    // 6. حفظ في الكاش لمدة 5 دقائق
    try {
      // @ts-ignore
      await this.prisma.cache.set(cacheKey, JSON.stringify(result), 300);
    } catch (e) {
      // نتابع لو الكاش فشل
    }

    return result;
  }

  async getTrendingOffers() {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // نأخذ أكثر 20 عرض عليهم تفاعل لنضمن وجود 10 نشطين منهم بعد الفلترة
    const topEvents = await this.prisma.analyticsEvent.groupBy({
      by: ['offerId'],
      where: {
        offerId: { not: null },
        createdAt: { gte: lastWeek }
      },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 20
    });

    const offerIds = topEvents.map(e => e.offerId as string);

    if (offerIds.length === 0) {
      return this.getLatestFallback();
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        id: { in: offerIds },
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED }
      },
      include: {
        store: {
          include: { category: true }
        }
      },
      take: 10
    });

    // لو الفلترة رجعت أقل من 3 عروض، نستخدم الـ fallback لضمان مظهر الصفحة
    if (offers.length < 3) {
      return this.getLatestFallback();
    }

    return offers;
  }

  private async getLatestFallback() {
    return this.prisma.offer.findMany({
      where: { status: OfferStatus.ACTIVE, store: { status: StoreStatus.APPROVED } },
      include: {
        store: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }
}
