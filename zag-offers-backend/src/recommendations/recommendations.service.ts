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
    // 1. إذا كان زائر، نعرض له التريند بناءً على منطقته (إذا كانت معروفة من الـ IP مستقبلاً) أو عامة
    if (!userId) {
      return this.getTrendingOffers();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return this.getTrendingOffers();

    // 2. حساب اهتمامات المستخدم بناءً على سلوكه
    const interests = await this.analyticsService.getUserInterests(userId);
    const { categoryWeights, areaWeights } = interests;

    // إضافة منطقة المستخدم الأساسية كعامل ترجيح
    if (user.area && !areaWeights[user.area]) {
      areaWeights[user.area] = 3; // وزن مرتفع لمنطقة السكن
    }

    const hasInterests =
      Object.keys(categoryWeights).length > 0 ||
      Object.keys(areaWeights).length > 0;

    if (!hasInterests) {
      return this.getTrendingOffers();
    }

    // 3. جلب pool من العروض النشطة
    const pool = await this.prisma.offer.findMany({
      where: {
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED },
      },
      select: {
        id: true,
        title: true,
        discount: true,
        endDate: true,
        images: true,
        originalPrice: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            area: true,
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
      take: 50, // نأخذ أحدث 50 عرض للمفاضلة بينهم
      orderBy: { createdAt: 'desc' },
    });

    // 4. نظام النقاط (Scoring System)
    const scoredOffers = pool.map((offer) => {
      let score = 0;
      const catId = offer.store.categoryId;
      const area = offer.store.area;

      // نقاط التصنيف (Category Match)
      if (categoryWeights[catId]) {
        score += categoryWeights[catId] * 2.5;
      }

      // نقاط المنطقة (Area Match)
      if (area && areaWeights[area]) {
        score += areaWeights[area] * 1.5;
      }

      // بونص للعروض الجديدة جداً (Recency Bonus)
      const hoursSinceCreated = (Date.now() - new Date(offer.createdAt).getTime()) / 3600000;
      if (hoursSinceCreated < 24) score += 2;

      return { ...offer, _score: score };
    });

    // 5. الترتيب والإرجاع
    scoredOffers.sort((a, b) => b._score - a._score);

    return scoredOffers.slice(0, 10).map(({ _score, ...offer }) => offer);
  }

  async getTrendingOffers() {
    // العروض الرائجة بناءً على عدد مرات التفاعل (Analytics Events) في آخر 7 أيام
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // نأخذ أكثر 10 عروض عليها تفاعل (مشاهدة أو كوبون)
    const topEvents = await this.prisma.analyticsEvent.groupBy({
      by: ['offerId'],
      where: {
        offerId: { not: null },
        createdAt: { gte: lastWeek }
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 12
    });

    const offerIds = topEvents.map(e => e.offerId as string);

    // إذا لم يكن هناك تفاعل كافٍ، نعود لأحدث العروض
    if (offerIds.length === 0) {
      return this.prisma.offer.findMany({
        where: { status: OfferStatus.ACTIVE, store: { status: StoreStatus.APPROVED } },
        include: { store: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    }

    return this.prisma.offer.findMany({
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
  }
}
