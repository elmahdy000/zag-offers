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

  async getRecommendedOffers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return [];

    // 1. حساب اهتمامات المستخدم بناءً على سلوكه (المشاهدات، المفضلة، الكوبونات)
    const interests = await this.analyticsService.getUserInterests(userId);
    const { categoryWeights, areaWeights } = interests;

    // إضافة منطقة المستخدم الأساسية كعامل ترجيح إذا لم تكن موجودة
    if (user.area && !areaWeights[user.area]) {
      areaWeights[user.area] = 2;
    }

    const hasInterests =
      Object.keys(categoryWeights).length > 0 ||
      Object.keys(areaWeights).length > 0;

    // إذا كان مستخدم جديد تماماً وليس لديه سلوك مسجل، نعرض له العروض الشائعة (التريند)
    if (!hasInterests) {
      return this.getTrendingOffers();
    }

    // 2. جلب مجموعة من العروض النشطة لتقييمها (مثلاً أحدث 100 عرض)
    // في التطبيقات الضخمة جداً، يمكن استخدام Elasticsearch أو محرك توصيات متخصص،
    // لكن هذه الطريقة ممتازة للمستوى الحالي.
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
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    // 3. تقييم (Scoring) كل عرض بناءً على مدى تطابقه مع اهتمامات المستخدم
    const scoredOffers = pool.map((offer) => {
      let score = 0;
      const catId = offer.store.categoryId;
      const area = offer.store.area;

      if (categoryWeights[catId]) {
        score += categoryWeights[catId] * 2; // التصنيف له وزن أعلى
      }

      if (area && areaWeights[area]) {
        score += areaWeights[area];
      }

      return { ...offer, _score: score };
    });

    // 4. ترتيب العروض حسب النقاط، وعرض أفضل 10
    scoredOffers.sort((a, b) => b._score - a._score);

    // إزالة حقل التقييم قبل الإرجاع
    return scoredOffers.slice(0, 10).map((o) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _score, ...offer } = o;
      return offer;
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
