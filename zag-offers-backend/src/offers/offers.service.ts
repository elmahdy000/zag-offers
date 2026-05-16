import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Offer, OfferStatus, StoreStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private uploadService: UploadService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearCache() {
    try {
      await this.cacheManager.clear();
      console.log('[OffersService] Global cache cleared successfully');
    } catch (err) {
      console.error('[OffersService] Failed to clear cache:', err);
    }
  }

  async getStoreByOwnerId(ownerId: string) {
    return this.prisma.store.findFirst({
      where: { ownerId },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(
    data: Prisma.OfferCreateInput,
    merchantId: string,
  ): Promise<Offer> {
    const storeConnect = data.store.connect as Prisma.StoreWhereUniqueInput;
    const storeId = storeConnect.id;
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) throw new NotFoundException('المحل غير موجود');

    if (store.ownerId !== merchantId) {
      const user = await this.prisma.user.findUnique({
        where: { id: merchantId },
      });
      if (user?.role !== 'ADMIN') {
        throw new UnauthorizedException(
          'عفواً، لا يمكنك إضافة عرض لمحل لا تملكه',
        );
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const endDate =
      data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    if (endDate < now) {
      throw new BadRequestException(
        'تاريخ انتهاء العرض لا يمكن أن يكون في الماضي',
      );
    }

    const offer = await this.prisma.offer.create({
      data,
      include: { store: true },
    });

    this.eventsGateway.notifyAdmin({
      type: 'NEW_PENDING_OFFER',
      title: 'عرض جديد بانتظار المراجعة',
      body: `محل "${offer.store.name}" أضاف عرض: ${offer.title}`,
      payload: { offerId: offer.id, storeName: offer.store.name },
    });

    void this.prisma.user
      .findMany({
        where: { role: 'ADMIN', fcmToken: { not: null } },
        select: { id: true },
      })
      .then((admins) => admins.map((admin) => admin.id))
      .then((adminIds) => {
        if (adminIds.length === 0) return;
        return this.notificationsService.sendToUserIds(adminIds, {
          title: 'عرض جديد بانتظار المراجعة',
          body: `المتجر "${offer.store.name}" أضاف عرضًا جديدًا: ${offer.title}`,
          data: {
            type: 'NEW_PENDING_OFFER',
            offerId: offer.id,
            storeName: offer.store.name,
          },
        });
      })
      .catch(() => undefined);

    await this.clearCache();
    return offer;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OfferWhereInput;
    orderBy?: Prisma.OfferOrderByWithRelationInput;
    includeMeta?: boolean;
    page?: number;
    limit?: number;
  }): Promise<unknown[] | { items: unknown[]; meta: any }> {
    const { skip, take, where, orderBy, includeMeta, page, limit } = params;

    const whereObj = where || {};
    const { status, store, ...safeWhere } = whereObj as {
      status?: unknown;
      store?: unknown;
      [key: string]: unknown;
    };

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const finalWhere: Prisma.OfferWhereInput = {
      ...safeWhere,
      status: OfferStatus.ACTIVE,
      endDate: { gte: startOfToday },
      store: { status: StoreStatus.APPROVED },
    };

    const items = await this.prisma.offer.findMany({
      skip,
      take,
      where: finalWhere,
      orderBy: orderBy || { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        discount: true,
        endDate: true,
        status: true,
        images: true,
        originalPrice: true,
        newPrice: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            area: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            coupons: {
              where: { status: 'USED' },
            },
          },
        },
      },
    });

    if (!includeMeta) {
      return items;
    }

    const total = await this.prisma.offer.count({ where: finalWhere });
    const currentLimit = limit ?? take ?? 10;
    const currentPage = page ?? 1;

    return {
      items,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        lastPage: Math.max(1, Math.ceil(total / currentLimit)),
        hasNext: currentPage * currentLimit < total,
        hasPrev: currentPage > 1,
      },
    };
  }

  async findMerchantOffers(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this user');
    }

    return this.prisma.offer.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: {
        store: true,
        _count: {
          select: { coupons: true },
        },
      },
    });
  }

  async findOne(id: string, userId?: string): Promise<Offer | null> {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id,
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED },
      },
      include: {
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    if (offer) {
      void this.prisma.offer
        .update({
          where: { id: offer.id },
          data: { views: { increment: 1 } },
        })
        .catch((err) =>
          console.error('Failed to increment view counter:', err),
        );

      void this.prisma.analyticsEvent
        .create({
          data: {
            offerId: offer.id,
            storeId: offer.storeId,
            userId: userId || null,
            eventType: 'OFFER_VIEW',
          },
        })
        .catch((err) => console.error('Failed to log analytics event:', err));
    }

    return offer;
  }

  async update(
    id: string,
    data: Prisma.OfferUpdateInput,
    merchantId: string,
  ): Promise<Offer> {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!offer) throw new NotFoundException('العرض غير موجود');

    if (offer.store.ownerId !== merchantId) {
      const user = await this.prisma.user.findUnique({
        where: { id: merchantId },
      });
      if (user?.role !== 'ADMIN') {
        throw new UnauthorizedException('لا تملك صلاحية تعديل هذا العرض');
      }
    }

    const updateData = { ...data };
    if (offer.status === OfferStatus.ACTIVE) {
      updateData.status = OfferStatus.PENDING;
    }

    if (data.images && Array.isArray(data.images)) {
      const oldImages = offer.images;
      const newImages = data.images as string[];

      const imagesToDelete = oldImages.filter(
        (img) => !newImages.includes(img),
      );
      for (const img of imagesToDelete) {
        await this.uploadService.deleteImage(img);
      }
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { id },
      data: updateData,
    });

    await this.clearCache();
    return updatedOffer;
  }

  async remove(id: string, merchantId: string): Promise<Offer> {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!offer) throw new NotFoundException('العرض غير موجود');

    if (offer.store.ownerId !== merchantId) {
      const user = await this.prisma.user.findUnique({
        where: { id: merchantId },
      });
      if (user?.role !== 'ADMIN') {
        throw new UnauthorizedException('لا تملك صلاحية حذف هذا العرض');
      }
    }

    await this.prisma.analyticsEvent.deleteMany({ where: { offerId: id } });
    await this.prisma.favorite.deleteMany({ where: { offerId: id } });
    await this.prisma.review.deleteMany({ where: { offerId: id } });
    await this.prisma.coupon.deleteMany({ where: { offerId: id } });

    if (offer.images && Array.isArray(offer.images)) {
      for (const img of offer.images) {
        await this.uploadService.deleteImage(img);
      }
    }

    const deletedOffer = await this.prisma.offer.delete({
      where: { id },
    });

    await this.clearCache();
    return deletedOffer;
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { status },
      include: { store: true },
    });

    if (status === OfferStatus.ACTIVE) {
      this.eventsGateway.broadcastNewOffer(offer);
    } else if (status === OfferStatus.REJECTED) {
      void this.eventsGateway.notifyMerchant(offer.store.ownerId, {
        type: 'OFFER_REJECTED',
        title: 'تم رفض عرضك',
        body: 'عذراً، تم رفض عرضك. برجاء مراجعة الشروط والأحكام',
        payload: { offerId: offer.id, offerTitle: offer.title },
      });
    }

    await this.clearCache();
    return offer;
  }
}
