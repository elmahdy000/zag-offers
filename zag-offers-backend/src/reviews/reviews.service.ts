import { BadRequestException, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  private getConnectedId(
    relation:
      | Prisma.StoreCreateNestedOneWithoutReviewsInput
      | Prisma.UserCreateNestedOneWithoutReviewsInput
      | undefined,
  ): string | undefined {
    if (!relation || !('connect' in relation) || !relation.connect) {
      return undefined;
    }

    return relation.connect.id;
  }

  async create(data: Prisma.ReviewCreateInput) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5');
    }

    const storeId = this.getConnectedId(data.store);
    const customerId = this.getConnectedId(data.customer);

    if (storeId && customerId) {
      const existing = await this.prisma.review.findFirst({
        where: { storeId, customerId },
      });

      if (existing) {
        throw new BadRequestException('قمت بتقييم هذا المحل من قبل');
      }
    }

    const review = await this.prisma.review.create({
      data,
      include: {
        store: true,
        customer: true,
      },
    });

    await this.recalculateStoreRating(review.storeId);

    if (review.store?.ownerId) {
      this.eventsGateway.notifyMerchant(review.store.ownerId, {
        type: 'NEW_REVIEW',
        title: 'تقييم جديد على محلك',
        body: `${review.customer?.name || 'عميل'} أعطى تقييم ${review.rating}/5`,
        payload: {
          storeId: review.storeId,
          rating: review.rating,
          comment: review.comment || '',
        },
      });
    }

    return review;
  }

  async findAllByStore(storeId: string) {
    return this.prisma.review.findMany({
      where: { storeId },
      include: { customer: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByOffer(offerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { offerId },
      include: {
        customer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) return [];

    // Batch coupon verification instead of N+1
    const customerIds = [...new Set(reviews.map((r) => r.customerId))];
    const coupons = await this.prisma.coupon.findMany({
      where: {
        offerId,
        customerId: { in: customerIds },
      },
      select: { customerId: true },
    });
    const verifiedCustomerIds = new Set(coupons.map((c) => c.customerId));

    return reviews.map((review) => ({
      ...review,
      isVerified: verifiedCustomerIds.has(review.customerId),
    }));
  }

  async remove(id: string, userId: string, userRole?: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new BadRequestException('Review not found');
    }
    const isOwner = review.customerId === userId;
    const isAdmin = userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new BadRequestException('Unauthorized');
    }

    const deleted = await this.prisma.review.delete({ where: { id } });
    await this.recalculateStoreRating(deleted.storeId);
    return deleted;
  }

  private async recalculateStoreRating(storeId: string) {
    try {
      const agg = await this.prisma.review.aggregate({
        where: { storeId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.store.update({
        where: { id: storeId },
        data: {
          ratingAvg: agg._avg.rating || 0,
          ratingCount: agg._count.rating,
        },
      });
    } catch (e) {
      Logger.warn(`Failed to recalculate rating for store ${storeId}: ${e}`);
    }
  }

  async addMerchantReply(reviewId: string, merchantId: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { store: { include: { owner: { select: { name: true } } } }, customer: true },
    });

    if (!review) {
      throw new NotFoundException('التقييم غير موجود');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: merchantId },
      select: { role: true },
    });

    const isStoreOwner = review.store?.ownerId === merchantId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isStoreOwner && !isAdmin) {
      throw new ForbiddenException('غير مصرح لك بالرد على تقييمات هذا المتجر');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        merchantReply: reply,
        replyCreatedAt: new Date(),
      },
    });

    const storeName = review.store?.name || 'المتجر';

    this.eventsGateway.notifyUser(review.customerId, 'review_reply', {
      type: 'REVIEW_REPLY',
      reviewId,
      storeId: review.storeId,
      storeName,
      merchantReply: reply,
      replyCreatedAt: new Date().toISOString(),
    });

    void this.notificationsService.sendToUserId(review.customerId, {
      title: 'رد على تقييمك',
      body: `قام "${storeName}" بالرد على تقييمك`,
      data: {
        type: 'REVIEW_REPLY',
        reviewId,
        storeId: review.storeId,
        storeName,
      },
    });

    return updated;
  }
}
