import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: {
    userId?: string;
    offerId?: string;
    storeId?: string;
    eventType: string;
  }) {
    try {
      await this.prisma.analyticsEvent.create({
        data,
      });
    } catch (error) {
      console.error('Failed to log analytics event:', error);
      // We don't want to throw error and break the main flow if analytics fails
    }
  }

  async getUserInterests(userId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        offer: {
          include: {
            store: true,
          },
        },
      },
    });

    // Count categories and areas from events
    const categoryWeights: Record<string, number> = {};
    const areaWeights: Record<string, number> = {};

    events.forEach((event) => {
      if (event.offer?.store) {
        const catId = event.offer.store.categoryId;
        const area = event.offer.store.area;

        // Weighting: Redemption (high), View (low)
        let weight = 1;
        if (event.eventType === 'COUPON_GENERATE') weight = 5;
        if (event.eventType === 'OFFER_FAVORITE') weight = 3;

        categoryWeights[catId] = (categoryWeights[catId] || 0) + weight;
        if (area) {
          areaWeights[area] = (areaWeights[area] || 0) + weight;
        }
      }
    });

    return { categoryWeights, areaWeights };
  }
}
