import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
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
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, customerId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new BadRequestException('Review not found');
    }
    if (review.customerId !== customerId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.review.delete({ where: { id } });
  }
}
