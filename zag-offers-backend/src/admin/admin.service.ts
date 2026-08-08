import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  CouponStatus,
  OfferStatus,
  Prisma,
  ReportStatus,
  Role,
  ReviewStatus,
  StoreStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ALL_ADMIN_PERMISSIONS } from '../common/permissions/admin-permissions';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type StoreUpdatePayload = {
  name?: string;
  address?: string;
  area?: string;
  phone?: string;
  whatsapp?: string;
  logo?: string;
  coverImage?: string;
  images?: string[];
  categoryId?: string;
  status?: StoreStatus;
};

type StoreCreatePayload = {
  name: string;
  categoryId: string;
  ownerId: string;
  address?: string;
  area?: string;
  phone?: string;
  whatsapp?: string;
  logo?: string;
  coverImage?: string;
  images?: string[];
  status?: StoreStatus;
};

type OfferUpdatePayload = {
  title?: string;
  description?: string;
  discount?: string;
  discountType?: string;
  terms?: string;
  startDate?: string;
  endDate?: string;
  usageLimit?: number | null;
  status?: OfferStatus;
  storeId?: string;
  images?: string[];
  originalPrice?: number;
  newPrice?: number;
  minSpend?: number;
  isFeatured?: boolean;
};

type OfferCreatePayload = {
  title: string;
  description: string;
  discount: string;
  discountType?: string;
  storeId: string;
  startDate: string;
  endDate: string;
  images: string[];
  terms?: string;
  usageLimit?: number;
  originalPrice?: number;
  newPrice?: number;
  minSpend?: number;
  isFeatured?: boolean;
};

@Injectable()
export class AdminService {
  private normalizeAdminPermissions(role: Role, permissions?: string[]) {
    if (role !== Role.STAFF) return [];
    const allowed = new Set<string>(ALL_ADMIN_PERMISSIONS);
    return [...new Set(permissions ?? [])].filter((permission) =>
      allowed.has(permission),
    );
  }

  private assertCanManagePrivilegedRole(
    actor: { id: string; role: Role },
    targetRole: Role,
  ) {
    if (
      actor.role !== Role.ADMIN &&
      (targetRole === Role.ADMIN || targetRole === Role.STAFF)
    ) {
      throw new ForbiddenException('Only administrators can manage privileged accounts');
    }
  }

  private validateOfferImages(images: string[]) {
    if (images.length > 10) {
      throw new BadRequestException('Maximum 10 images are allowed per offer');
    }

    const normalized = images.map((img) => img.trim()).filter(Boolean);
    if (normalized.length !== images.length) {
      throw new BadRequestException('Offer images cannot contain empty values');
    }

    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      throw new BadRequestException('Offer images cannot contain duplicates');
    }

    for (const img of normalized) {
      if (!/^https?:\/\/.+/i.test(img) && !img.startsWith('/')) {
        throw new BadRequestException(
          `Invalid image URL "${img}". Use absolute URL or server-relative path`,
        );
      }
    }
  }

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
    private subscriptions: SubscriptionsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearCache() {
    try {
      await this.cacheManager.clear();
      console.log('[AdminService] Global cache cleared successfully');
    } catch (err) {
      console.error('[AdminService] Failed to clear cache:', err);
    }
  }

  async getGlobalStats() {
    const [
      totalUsers,
      totalMerchants,
      totalStores,
      pendingStores,
      approvedStores,
      totalOffers,
      activeOffers,
      pendingOffers,
      expiredOffers,
      totalCouponsGenerated,
      totalCouponsUsed,
      totalFavorites,
      totalReviews,
      totalPoints,
      tierBronze,
      tierSilver,
      tierGold,
      tierPlatinum,
      totalAdminRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.user.count({ where: { role: Role.MERCHANT } }),
      this.prisma.store.count(),
      this.prisma.store.count({ where: { status: StoreStatus.PENDING } }),
      this.prisma.store.count({ where: { status: StoreStatus.APPROVED } }),
      this.prisma.offer.count(),
      this.prisma.offer.count({ where: { status: OfferStatus.ACTIVE } }),
      this.prisma.offer.count({ where: { status: OfferStatus.PENDING } }),
      this.prisma.offer.count({ where: { status: OfferStatus.EXPIRED } }),
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { status: CouponStatus.USED } }),
      this.prisma.favorite.count(),
      this.prisma.review.count(),
      this.prisma.user.aggregate({ _sum: { points: true } }),
      this.prisma.user.count({ where: { tier: 'BRONZE' } }),
      this.prisma.user.count({ where: { tier: 'SILVER' } }),
      this.prisma.user.count({ where: { tier: 'GOLD' } }),
      this.prisma.user.count({ where: { tier: 'PLATINUM' } }),
      this.prisma.coupon.aggregate({ _sum: { commissionAmount: true }, where: { status: CouponStatus.USED } }),
    ]);

    const couponConversionRate =
      totalCouponsGenerated > 0
        ? Math.round((totalCouponsUsed / totalCouponsGenerated) * 100)
        : 0;

    return {
      users: { 
        totalUsers, 
        totalMerchants,
        tiers: {
          bronze: tierBronze,
          silver: tierSilver,
          gold: tierGold,
          platinum: tierPlatinum,
        },
        totalPoints: totalPoints._sum.points || 0
      },
      stores: { totalStores, pendingStores, approvedStores },
      offers: { totalOffers, activeOffers, pendingOffers, expiredOffers },
      coupons: {
        totalCouponsGenerated,
        totalCouponsUsed,
        couponConversionRate: `${couponConversionRate}%`,
      },
      revenue: {
        totalCommission: totalAdminRevenue._sum.commissionAmount || 0,
      },
      engagement: { totalFavorites, totalReviews },
    };
  }

  async getStatsByPeriod(period: 'today' | 'week' | 'month') {
    const now = new Date();
    let from: Date;

    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      from = new Date(now.getTime() - 7 * 86400000);
    } else {
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const [newUsers, newStores, newOffers, newCoupons] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: from } } }),
      this.prisma.store.count({ where: { createdAt: { gte: from } } }),
      this.prisma.offer.count({ where: { createdAt: { gte: from } } }),
      this.prisma.coupon.count({ where: { createdAt: { gte: from } } }),
    ]);

    return {
      period,
      from: from.toISOString(),
      newUsers,
      newStores,
      newOffers,
      newCoupons,
    };
  }

  async getTopCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { stores: true } },
        stores: {
          where: { status: StoreStatus.APPROVED },
          include: { _count: { select: { offers: true } } },
        },
      },
    });

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        storeCount: category._count.stores,
        count: category.stores.reduce(
          (sum, store) => sum + store._count.offers,
          0,
        ),
        totalOffers: category.stores.reduce(
          (sum, store) => sum + store._count.offers,
          0,
        ),
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getTopStores(limit = 10) {
    const stores = await this.prisma.store.findMany({
      where: { status: StoreStatus.APPROVED },
      include: {
        category: { select: { name: true } },
        _count: { select: { offers: true, reviews: true } },
      },
      take: limit,
      orderBy: { reviews: { _count: 'desc' } },
    });

    const storeStats = await Promise.all(
      stores.map(async (store) => {
        const redeemedCount = await this.prisma.coupon.count({
          where: {
            offer: { storeId: store.id },
            status: CouponStatus.USED,
          },
        });
        return {
          ...store,
          totalCoupons: redeemedCount,
        };
      }),
    );

    return storeStats;
  }

  async getAllStores(params: {
    status?: StoreStatus;
    categoryId?: string;
    area?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, categoryId, area, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.StoreWhereInput = {};

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (area) where.area = area;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        include: {
          category: true,
          owner: { select: { id: true, name: true, phone: true, email: true } },
          _count: { select: { offers: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async getPendingStores() {
    return this.prisma.store.findMany({
      where: { status: StoreStatus.PENDING },
      include: {
        category: true,
        owner: { select: { id: true, name: true, phone: true, email: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  }

  async getStoreDetails(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            area: true,
            avatar: true,
            createdAt: true,
          },
        },
        offers: {
          include: { _count: { select: { coupons: true, favorites: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reviews: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        branches: {
          include: { city: true, area: true },
          orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        },
        _count: { select: { offers: true, reviews: true } },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Offers shown above are intentionally capped at 20, so keep this aggregate
    // query separate to return the accurate coupon total for the whole store.
    const couponCount = await this.prisma.coupon.count({
      where: { offer: { storeId: id } },
    });

    return {
      ...store,
      _count: {
        ...store._count,
        coupons: couponCount,
      },
    };
  }

  async updateStore(id: string, payload: StoreUpdatePayload) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (payload.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: payload.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const normalizedName = payload.name?.trim();
    const normalizedPhone = payload.phone?.trim();
    if (normalizedName || normalizedPhone) {
      const duplicate = await this.prisma.store.findFirst({
        where: {
          id: { not: id },
          ownerId: store.ownerId,
          OR: [
            ...(normalizedName
              ? [{ name: { equals: normalizedName, mode: 'insensitive' as const } }]
              : []),
            ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ],
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException('يوجد متجر آخر بنفس الاسم أو رقم الهاتف لهذا المالك');
      }
    }

    const updated = await this.prisma.store.update({
      where: { id },
      data: {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.area !== undefined ? { area: payload.area } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        ...(payload.whatsapp !== undefined
          ? { whatsapp: payload.whatsapp }
          : {}),
        // Only update logo/coverImage if a non-empty value is provided (prevents wiping images on form save)
        ...(payload.logo !== undefined && payload.logo !== ''
          ? { logo: payload.logo }
          : {}),
        ...(payload.coverImage !== undefined && payload.coverImage !== ''
          ? { coverImage: payload.coverImage }
          : {}),
        ...(payload.images !== undefined ? { images: payload.images } : {}),
        ...(payload.categoryId !== undefined
          ? { categoryId: payload.categoryId }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    });

    await this.clearCache();
    return updated;
  }

  async approveStore(id: string, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, fcmToken: true, email: true, phone: true, avatar: true, role: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.status === StoreStatus.APPROVED) {
      throw new BadRequestException('Store is already approved');
    }

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: StoreStatus.APPROVED },
      include: { owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } }, category: true },
    });

    this.eventsGateway.notifyMerchant(store.ownerId, {
      type: 'STORE_APPROVED',
      title: 'تم اعتماد المتجر',
      body: `تمت الموافقة على "${store.name}". يمكنك الآن البدء في إضافة عروضك.`,
      payload: { storeId: store.id, storeName: store.name },
    });

    await this.auditLogService.log({
      action: 'APPROVE_STORE',
      adminId,
      targetId: id,
      targetName: store.name,
    });

    await this.clearCache();
    return updated;
  }

  async rejectStore(id: string, adminId: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, fcmToken: true, email: true, phone: true, avatar: true, role: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: StoreStatus.REJECTED },
      include: { owner: { select: { id: true, name: true, fcmToken: true, email: true, phone: true, avatar: true, role: true } } },
    });

    this.eventsGateway.notifyMerchant(store.ownerId, {
      type: 'STORE_REJECTED',
      title: 'تم رفض طلب المتجر',
      body: reason || 'نعتذر، لم يتم اعتماد طلب المتجر الحالي.',
      payload: { storeId: store.id, storeName: store.name },
    });

    await this.auditLogService.log({
      action: 'REJECT_STORE',
      adminId,
      targetId: id,
      targetName: store.name,
      details: reason,
    });

    await this.clearCache();
    return updated;
  }

  async suspendStore(id: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, fcmToken: true, email: true, phone: true, avatar: true, role: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');

    const [updated] = await Promise.all([
      this.prisma.store.update({
        where: { id },
        data: { status: StoreStatus.SUSPENDED },
      }),
      this.prisma.offer.updateMany({
        where: { storeId: id, status: OfferStatus.ACTIVE },
        data: { status: OfferStatus.PAUSED },
      }),
    ]);

    this.eventsGateway.notifyMerchant(store.ownerId, {
      type: 'STORE_SUSPENDED',
      title: 'تنبيه: تم إيقاف المتجر',
      body: reason || 'تم إيقاف نشاط المتجر مؤقتاً لمراجعة البيانات.',
      payload: { storeId: store.id, storeName: store.name },
    });

    await this.clearCache();
    return updated;
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');

    const offers = await this.prisma.offer.findMany({ where: { storeId: id }, select: { id: true } });
    const offerIds = offers.map(o => o.id);

    const results = await this.prisma.$transaction([
      this.prisma.analyticsEvent.deleteMany({ where: { offerId: { in: offerIds } } }),
      this.prisma.favorite.deleteMany({ where: { offerId: { in: offerIds } } }),
      this.prisma.coupon.deleteMany({ where: { offerId: { in: offerIds } } }),
      this.prisma.review.deleteMany({ where: { offerId: { in: offerIds } } }),
      this.prisma.offer.deleteMany({ where: { storeId: id } }),
      this.prisma.analyticsEvent.deleteMany({ where: { storeId: id } }),
      this.prisma.review.deleteMany({ where: { storeId: id } }),
      this.prisma.store.delete({ where: { id } }),
    ]);

    await this.clearCache();
    return results[7];
  }

  async getAllOffers(query: {
    status?: OfferStatus;
    storeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, storeId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.OfferWhereInput = {};

    if (status) where.status = status;
    if (storeId) where.storeId = storeId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { store: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          store: {
            include: {
              category: { select: { id: true, name: true } },
              owner: { select: { id: true, name: true, phone: true } },
            },
          },
          _count: { select: { coupons: { where: { status: 'USED' } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.offer.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async getPendingOffers() {
    return this.prisma.offer.findMany({
      where: { status: OfferStatus.PENDING },
      include: {
        store: {
          include: {
            owner: { select: { id: true, name: true, phone: true } },
            category: true,
          },
        },
        _count: { select: { coupons: { where: { status: 'USED' } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  }

  async getOfferDetails(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            category: true,
            owner: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                area: true,
              },
            },
          },
        },
        coupons: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { coupons: { where: { status: 'USED' } }, favorites: true, reviews: true } },
        reviews: {
          include: {
            customer: { select: { id: true, name: true, phone: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async updateOffer(id: string, payload: OfferUpdatePayload, adminId?: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (payload.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: payload.storeId },
      });
      if (!store) {
        throw new BadRequestException('Store not found');
      }
    }

    const startDate = payload.startDate
      ? new Date(payload.startDate)
      : undefined;
    const endDate = payload.endDate ? new Date(payload.endDate) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid end date');
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (payload.images !== undefined) {
      this.validateOfferImages(payload.images);
    }

    const updated = await this.prisma.offer.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
        ...(payload.discount !== undefined
          ? { discount: payload.discount }
          : {}),
        ...(payload.terms !== undefined ? { terms: payload.terms } : {}),
        ...(payload.usageLimit !== undefined
          ? { usageLimit: payload.usageLimit }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.storeId !== undefined ? { storeId: payload.storeId } : {}),
        ...(payload.images !== undefined ? { images: payload.images } : {}),
        ...(payload.originalPrice !== undefined
          ? { originalPrice: payload.originalPrice ? +payload.originalPrice : null }
          : {}),
        ...(payload.newPrice !== undefined
          ? { newPrice: payload.newPrice ? +payload.newPrice : null }
          : {}),
        ...(payload.discountType !== undefined
          ? { discountType: payload.discountType }
          : {}),
        ...(payload.minSpend !== undefined
          ? { minSpend: payload.minSpend ? +payload.minSpend : null }
          : {}),
        ...(payload.isFeatured !== undefined
          ? { isFeatured: payload.isFeatured }
          : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      },
      include: {
        store: {
          include: {
            category: { select: { id: true, name: true } },
            owner: {
              select: { id: true, name: true, phone: true, fcmToken: true },
            },
          },
        },
        _count: { select: { coupons: { where: { status: 'USED' } } } },
      },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'UPDATE_OFFER',
        adminId,
        targetId: id,
        targetName: updated.title,
      });
    }

    if (updated.store?.ownerId) {
      this.eventsGateway.notifyMerchant(updated.store.ownerId, {
        type: 'OFFER_UPDATED',
        title: 'تحديث في بيانات العرض',
        body: `تم إجراء تحديث على عرضك "${updated.title}".`,
        payload: { offerId: updated.id, offerTitle: updated.title },
      });
    }

    await this.clearCache();
    return updated;
  }

  async approveOffer(id: string, adminId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: { include: { owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } } } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status === OfferStatus.ACTIVE) {
      throw new BadRequestException('Offer is already active');
    }

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.ACTIVE, isNotified: true },
      include: { store: true },
    });

    this.eventsGateway.broadcastNewOffer(updated);

    const imageUrl =
      offer.images && offer.images.length > 0 ? offer.images[0] : undefined;

    // Notify the merchant
    this.eventsGateway.notifyMerchant(offer.store.ownerId, {
      type: 'OFFER_APPROVED',
      title: 'تم قبول العرض بنجاح',
      body: `عرضك "${offer.title}" متاح الآن لجميع العملاء.`,
      payload: { offerId: offer.id, offerTitle: offer.title },
    });

    // Notify customers in the area about the new offer
    if (offer.store?.area) {
      void this.notificationsService.notifyNewOfferInArea(
        offer.store.area,
        offer.store.name,
        offer.title,
        offer.id,
        imageUrl,
      );
    } else {
      void this.notificationsService.sendToAll(
        `عرض جديد 🎉`,
        `${offer.store.name}: "${offer.title}" - متاح الآن لفترة محدودة.`,
        { offerId: offer.id, type: 'NEW_OFFER' },
        imageUrl,
      );
    }

    // Also Notify Store Fans (Favorites / Past Customers)
    void this.notificationsService.notifyStoreFans(
      offer.storeId,
      offer.store.name,
      offer.title,
      offer.id,
      imageUrl,
    );

    await this.auditLogService.log({
      action: 'APPROVE_OFFER',
      adminId,
      targetId: id,
      targetName: offer.title,
    });

    await this.clearCache();
    return updated;
  }

  async rejectOffer(id: string, adminId: string, reason?: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: { include: { owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } } } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.REJECTED },
      include: { store: true },
    });

    this.eventsGateway.notifyMerchant(offer.store.ownerId, {
      type: 'OFFER_REJECTED',
      title: 'تم رفض العرض',
      body: reason || 'نعتذر، لم يتم اعتماد العرض المرسل.',
      payload: { offerId: offer.id, offerTitle: offer.title },
    });

    await this.auditLogService.log({
      action: 'REJECT_OFFER',
      adminId,
      targetId: id,
      details: reason,
    });

    await this.clearCache();
    return updated;
  }

  async deleteOffer(id: string, adminId?: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    
    const results = await this.prisma.$transaction([
      this.prisma.analyticsEvent.deleteMany({ where: { offerId: id } }),
      this.prisma.favorite.deleteMany({ where: { offerId: id } }),
      this.prisma.coupon.deleteMany({ where: { offerId: id } }),
      this.prisma.review.deleteMany({ where: { offerId: id } }),
      this.prisma.offer.delete({ where: { id } }),
    ]);

    const deleted = results[4];

    if (adminId) {
      await this.auditLogService.log({
        action: 'DELETE_OFFER',
        adminId,
        targetId: id,
        targetName: offer.title,
      });
    }

    await this.clearCache();
    return deleted;
  }

  async getAllUsers(params: {
    role?: Role;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { role, page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total, roleCounts] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          area: true,
          avatar: true,
          createdAt: true,
          points: true,
          tier: true,
          _count: { select: { stores: true, coupons: true, favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
    ]);

    const summary = roleCounts.reduce(
      (counts, item) => {
        counts[item.role.toLowerCase() as 'customer' | 'merchant' | 'admin'] = item._count._all;
        return counts;
      },
      { customer: 0, merchant: 0, admin: 0 },
    );

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        summary,
      },
    };
  }

  async createUser(data: CreateUserDto, actor: { id: string; role: Role }) {
    try {
      this.assertCanManagePrivilegedRole(actor, data.role);
      const existing = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new BadRequestException('User with this phone already exists');
      }

      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : await bcrypt.hash('123456', 10);

      const created = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          adminPermissions: this.normalizeAdminPermissions(
            data.role,
            data.adminPermissions,
          ),
        },
      });
      await this.auditLogService.log({
        action: 'CREATE_USER',
        adminId: actor.id,
        targetId: created.id,
        targetName: created.name,
        details: JSON.stringify({ role: created.role }),
      });
      const { password, ...safeUser } = created;
      return safeUser;
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create user: ' + errorMessage);
    }
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    actor: { id: string; role: Role },
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      const nextRole = data.role ?? user.role;
      this.assertCanManagePrivilegedRole(actor, user.role);
      this.assertCanManagePrivilegedRole(actor, nextRole);
      if (id === actor.id && nextRole !== user.role) {
        throw new BadRequestException('You cannot change your own role');
      }
      if (user.role === Role.ADMIN && nextRole !== Role.ADMIN) {
        const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
        if (adminCount <= 1) {
          throw new BadRequestException('The last administrator cannot be demoted');
        }
      }

      if (data.phone && data.phone !== user.phone) {
        const existing = await this.prisma.user.findUnique({
          where: { phone: data.phone },
        });
        if (existing)
          throw new BadRequestException('Phone number already in use');
      }

      const { password, ...updateData } = data;
      const finalData: Prisma.UserUpdateInput = {
        ...updateData,
        adminPermissions: this.normalizeAdminPermissions(
          nextRole,
          data.adminPermissions ?? user.adminPermissions,
        ),
      };

      if (password) {
        finalData.password = await bcrypt.hash(password, 10);
      }

      if (password) {
        finalData.tokenVersion = { increment: 1 };
      }

      const updated = await this.prisma.user.update({
        where: { id },
        data: finalData,
      });
      await this.auditLogService.log({
        action: 'UPDATE_USER',
        adminId: actor.id,
        targetId: updated.id,
        targetName: updated.name,
        details: JSON.stringify({ fields: Object.keys(data), role: updated.role }),
      });
      const { password: hiddenPassword, ...safeUser } = updated;
      return safeUser;
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update user: ' + errorMessage);
    }
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        area: true,
        avatar: true,
        createdAt: true,
        points: true,
        tier: true,
        stores: {
          include: { _count: { select: { offers: true } } },
        },
        coupons: {
          include: { offer: { select: { title: true, discount: true, discountType: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          include: { store: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        favorites: {
          include: { offer: { select: { title: true, discount: true, discountType: true, store: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            stores: true,
            coupons: true,
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const pointHistory = await this.prisma.pointLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { ...user, pointHistory };
  }

  async changeUserRole(
    id: string,
    role: Role,
    actor: { id: string; role: Role },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    this.assertCanManagePrivilegedRole(actor, user.role);
    this.assertCanManagePrivilegedRole(actor, role);
    if (id === actor.id) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new BadRequestException('The last administrator cannot be demoted');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role,
        adminPermissions: this.normalizeAdminPermissions(role, user.adminPermissions),
        tokenVersion: { increment: 1 },
      },
      select: { id: true, name: true, role: true },
    });
    await this.auditLogService.log({
      action: 'CHANGE_USER_ROLE',
      adminId: actor.id,
      targetId: updated.id,
      targetName: updated.name,
      details: JSON.stringify({ from: user.role, to: role }),
    });
    return updated;
  }

  async adjustUserPoints(id: string, action: 'ADD' | 'REMOVE', amount: number, reason: string, adminId: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (action === 'REMOVE' && user.points < amount) {
      throw new BadRequestException('User does not have enough points');
    }

    const tx = this.prisma;
    const finalAmount = action === 'ADD' ? amount : -amount;
    const newPoints = user.points + finalAmount;
    
    // Calculate new tier
    let newTier = 'BRONZE';
    if (newPoints >= 5000) newTier = 'PLATINUM';
    else if (newPoints >= 2000) newTier = 'GOLD';
    else if (newPoints >= 500) newTier = 'SILVER';

    await (tx as any).$transaction([
      (tx as any).user.update({
        where: { id },
        data: {
          points: newPoints,
          tier: newTier,
        },
      }),
      (tx as any).pointLog.create({
        data: {
          userId: id,
          amount: finalAmount,
          reason: `MANUAL_ADJUSTMENT: ${reason}`,
        },
      }),
    ]);

    await this.auditLogService.log({
      action: action === 'ADD' ? 'ADD_POINTS' : 'REMOVE_POINTS',
      adminId,
      targetId: id,
      targetName: user.name,
      details: JSON.stringify({ amount, reason, previousPoints: user.points, newPoints }),
    });

    return { message: 'Points adjusted successfully', newPoints, newTier };
  }

  async deleteUser(id: string, actor: { id: string; role: Role }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { stores: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    this.assertCanManagePrivilegedRole(actor, user.role);
    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new BadRequestException('The last administrator cannot be deleted');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (user.stores.length > 0) {
        const storeIds = user.stores.map((s) => s.id);
        const merchantOffers = await tx.offer.findMany({
          where: { storeId: { in: storeIds } },
        });
        const offerIds = merchantOffers.map((o) => o.id);

        if (offerIds.length > 0) {
          await tx.favorite.deleteMany({
            where: { offerId: { in: offerIds } },
          });
          await tx.coupon.deleteMany({ where: { offerId: { in: offerIds } } });
          await tx.review.deleteMany({ where: { offerId: { in: offerIds } } });
          await tx.offer.deleteMany({ where: { storeId: { in: storeIds } } });
        }

        await tx.review.deleteMany({ where: { storeId: { in: storeIds } } });
        await tx.store.deleteMany({ where: { ownerId: id } });
      }

      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { customerId: id } });
      await tx.coupon.deleteMany({ where: { customerId: id } });

      const deleted = await tx.user.delete({ where: { id } });
      return deleted;
    });

    await this.clearCache();
    await this.auditLogService.log({
      action: 'DELETE_USER',
      adminId: actor.id,
      targetId: id,
      targetName: user.name,
      details: JSON.stringify({ role: user.role }),
    });
    return result;
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { stores: true } } },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  async createCategory(name: string, image?: string, priority?: number, adminId?: string) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Category name is required');
    }

    const existing = await this.prisma.category.findUnique({
      where: { name: normalizedName },
    });
    if (existing) {
      throw new BadRequestException('Category already exists');
    }

    const created = await this.prisma.category.create({
      data: {
        name: normalizedName,
        image: image || null,
        priority: priority !== undefined ? Number(priority) : 0,
      },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'CREATE_CATEGORY',
        adminId,
        targetId: created.id,
        targetName: created.name,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastCategoriesUpdated({
      action: 'CREATED',
      categoryId: created.id,
      categoryName: created.name,
    });
    return created;
  }

  async updateCategory(
    id: string,
    name: string,
    image?: string,
    priority?: number,
    adminId?: string,
  ) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Category name is required');
    }

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const duplicate = await this.prisma.category.findFirst({
      where: {
        name: normalizedName,
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new BadRequestException('القسم موجود بالفعل');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: normalizedName,
        image: image !== undefined ? image : (category as any).image,
        priority: priority !== undefined ? Number(priority) : undefined,
      },
      include: { _count: { select: { stores: true } } },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'UPDATE_CATEGORY',
        adminId,
        targetId: id,
        targetName: updated.name,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastCategoriesUpdated({
      action: 'UPDATED',
      categoryId: updated.id,
      categoryName: updated.name,
    });
    return updated;
  }

  async deleteCategory(id: string, adminId?: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const storesCount = await this.prisma.store.count({
      where: { categoryId: id },
    });
    if (storesCount > 0) {
      throw new BadRequestException(
        `لا يمكن حذف القسم لأنه يحتوي على ${storesCount} متاجر/متجر`,
      );
    }

    const deleted = await this.prisma.category.delete({ where: { id } });

    if (adminId) {
      await this.auditLogService.log({
        action: 'DELETE_CATEGORY',
        adminId,
        targetId: id,
        targetName: category.name,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastCategoriesUpdated({
      action: 'DELETED',
      categoryId: deleted.id,
      categoryName: category.name,
    });
    return deleted;
  }

  async getAllBanners() {
    const banners = await this.prisma.banner.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return Promise.all(
      banners.map(async (banner) => {
        let offer = null;
        let store = null;

        if (banner.actionUrl) {
          if (banner.actionUrl.startsWith('offer:')) {
            const offerId = banner.actionUrl.substring(6);
            const found = await this.prisma.offer.findUnique({
              where: { id: offerId },
              select: { id: true, title: true },
            });
            if (found) offer = found;
          } else if (banner.actionUrl.startsWith('store:')) {
            const storeId = banner.actionUrl.substring(6);
            const found = await this.prisma.store.findUnique({
              where: { id: storeId },
              select: { id: true, name: true },
            });
            if (found) store = found;
          }
        }

        return {
          ...banner,
          offer,
          store,
        };
      }),
    );
  }

  async createBanner(
    data: {
      title: string;
      subtitle?: string;
      tag?: string;
      image?: string;
      actionUrl?: string;
      offerId?: string;
      isActive?: boolean;
      priority?: number;
    },
    adminId?: string,
  ) {
    const title = data.title?.trim();
    if (!title) throw new BadRequestException('Banner title is required');

    const created = await this.prisma.banner.create({
      data: {
        title,
        subtitle: data.subtitle?.trim() || null,
        tag: data.tag?.trim() || null,
        image: data.image?.trim() || null,
        actionUrl: data.actionUrl?.trim() || null,
        offerId: data.offerId || null,
        isActive: data.isActive ?? true,
        priority: data.priority !== undefined ? Number(data.priority) : 0,
      },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'CREATE_BANNER',
        adminId,
        targetId: created.id,
        targetName: created.title,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastBannersUpdated({
      action: 'CREATED',
      bannerId: created.id,
      bannerTitle: created.title,
    });
    return created;
  }

  async updateBanner(
    id: string,
    data: {
      title?: string;
      subtitle?: string;
      tag?: string;
      image?: string;
      actionUrl?: string;
      offerId?: string;
      isActive?: boolean;
      priority?: number;
    },
    adminId?: string,
  ) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');

    const title = data.title?.trim();
    if (data.title !== undefined && !title) {
      throw new BadRequestException('Banner title cannot be empty');
    }

    const updated = await this.prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(data.subtitle !== undefined
          ? { subtitle: data.subtitle.trim() || null }
          : {}),
        ...(data.tag !== undefined ? { tag: data.tag.trim() || null } : {}),
        ...(data.image !== undefined
          ? { image: data.image.trim() || null }
          : {}),
        ...(data.actionUrl !== undefined
          ? { actionUrl: data.actionUrl.trim() || null }
          : {}),
        ...(data.offerId !== undefined ? { offerId: data.offerId || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.priority !== undefined
          ? { priority: Number(data.priority) }
          : {}),
      },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'UPDATE_BANNER',
        adminId,
        targetId: updated.id,
        targetName: updated.title,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastBannersUpdated({
      action: 'UPDATED',
      bannerId: updated.id,
      bannerTitle: updated.title,
    });
    return updated;
  }

  async deleteBanner(id: string, adminId?: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');

    const deleted = await this.prisma.banner.delete({ where: { id } });

    if (adminId) {
      await this.auditLogService.log({
        action: 'DELETE_BANNER',
        adminId,
        targetId: deleted.id,
        targetName: existing.title,
      });
    }

    await this.clearCache();
    this.eventsGateway.broadcastBannersUpdated({
      action: 'DELETED',
      bannerId: deleted.id,
      bannerTitle: existing.title,
    });
    return deleted;
  }

  async getAllCoupons(params: {
    status?: CouponStatus;
    storeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, storeId, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {};
    if (status) where.status = status;
    if (storeId) where.offer = { storeId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        {
          offer: { store: { name: { contains: search, mode: 'insensitive' } } },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        include: {
          offer: {
            select: {
              id: true,
              title: true,
              discount: true,
              store: { select: { id: true, name: true } },
            },
          },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      items: data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async getCouponDetails(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            store: {
              include: {
                category: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            area: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon record not found');

    return this.prisma.coupon.delete({ where: { id } });
  }

  async broadcastAnnouncement(params: {
    title: string;
    body: string;
    area?: string;
    imageUrl?: string;
    actionType?: string;
    actionValue?: string;
    adminId: string;
  }) {
    const { title, body, area, imageUrl, actionType, actionValue, adminId } = params;
    const recipientCount = await this.prisma.user.count({
      where: area ? { area } : undefined,
    });

    if (area) {
      // Send to a specific area
      await this.notificationsService.sendToArea(
        area,
        title,
        body,
        { 
          type: actionType || 'ANNOUNCEMENT',
          ...(actionValue ? { actionValue } : {})
        },
        imageUrl,
      );
      this.eventsGateway.broadcastAnnouncement({
        type: actionType || 'ANNOUNCEMENT',
        title,
        body,
        area,
        actionValue,
      });
    } else {
      // No area specified → send to ALL users
      await this.notificationsService.sendToAll(
        title,
        body,
        { 
          type: actionType || 'ANNOUNCEMENT',
          ...(actionValue ? { actionValue } : {})
        },
        imageUrl,
      );
      this.eventsGateway.broadcastAnnouncement({
        type: actionType || 'ANNOUNCEMENT',
        title,
        body,
        area: 'all',
        actionValue,
      });
    }

    await this.auditLogService.log({
      action: 'SEND_BROADCAST',
      adminId,
      details: `Title: ${title}, Area: ${area || 'all'}`,
    });
    await this.prisma.broadcastLog.create({
      data: {
        title,
        body,
        area: area || null,
        imageUrl: imageUrl || null,
        actionType: actionType || 'ANNOUNCEMENT',
        actionValue: actionValue || null,
        recipientCount,
        createdById: adminId,
      },
    });
    return {
      success: true,
      recipientCount,
      message: area
        ? `Announcement sent to area ${area}`
        : 'Announcement sent to all users',
    };
  }

  async getBroadcastHistory(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      this.prisma.broadcastLog.findMany({
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.broadcastLog.count(),
    ]);
    return {
      items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        lastPage: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getReviews(params: {
    page?: number;
    limit?: number;
    status?: ReviewStatus;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const search = params.search?.trim();
    const where: Prisma.ReviewWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(search ? {
        OR: [
          { comment: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { store: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          store: { select: { id: true, name: true } },
          offer: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return { items, meta: { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) } };
  }

  async moderateReview(
    id: string,
    status: ReviewStatus,
    note: string | undefined,
    adminId: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { store: { select: { name: true } } },
    });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: { status, moderationNote: note?.trim() || null },
    });
    await this.auditLogService.log({
      action: status === ReviewStatus.HIDDEN ? 'HIDE_REVIEW' : 'PUBLISH_REVIEW',
      adminId,
      targetId: id,
      targetName: review.store.name,
      details: JSON.stringify({ note: note?.trim() || null }),
    });
    return updated;
  }

  async getContentReports(params: { page?: number; limit?: number; status?: ReportStatus }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const where = params.status ? { status: params.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, phone: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contentReport.count({ where }),
    ]);
    return { items, meta: { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) } };
  }

  async resolveContentReport(
    id: string,
    status: ReportStatus,
    note: string | undefined,
    adminId: string,
  ) {
    if (status === ReportStatus.OPEN) {
      throw new BadRequestException('Resolution status must be RESOLVED or DISMISSED');
    }
    const report = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    const updated = await this.prisma.contentReport.update({
      where: { id },
      data: {
        status,
        resolutionNote: note?.trim() || null,
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });
    await this.auditLogService.log({
      action: status === ReportStatus.RESOLVED ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
      adminId,
      targetId: id,
      targetName: `${report.entityType}:${report.entityId}`,
      details: JSON.stringify({ note: note?.trim() || null }),
    });
    return updated;
  }

  async getLocations() {
    return this.prisma.city.findMany({
      include: {
        areas: { orderBy: [{ priority: 'desc' }, { name: 'asc' }] },
        _count: { select: { stores: true, branches: true } },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  async createCity(
    data: { name: string; priority?: number; isActive?: boolean },
    adminId: string,
  ) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('City name is required');
    const city = await this.prisma.city.create({
      data: {
        name,
        priority: Number(data.priority ?? 0),
        isActive: data.isActive ?? true,
      },
    });
    await this.auditLogService.log({ action: 'CREATE_CITY', adminId, targetId: city.id, targetName: city.name });
    return city;
  }

  async updateCity(
    id: string,
    data: { name?: string; priority?: number; isActive?: boolean },
    adminId: string,
  ) {
    const existing = await this.prisma.city.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('City not found');
    const city = await this.prisma.city.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.priority !== undefined ? { priority: Number(data.priority) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    await this.auditLogService.log({ action: 'UPDATE_CITY', adminId, targetId: city.id, targetName: city.name });
    return city;
  }

  async createArea(
    data: { cityId: string; name: string; priority?: number; isActive?: boolean },
    adminId: string,
  ) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Area name is required');
    const city = await this.prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) throw new NotFoundException('City not found');
    const area = await this.prisma.area.create({
      data: {
        cityId: data.cityId,
        name,
        priority: Number(data.priority ?? 0),
        isActive: data.isActive ?? true,
      },
    });
    await this.auditLogService.log({ action: 'CREATE_AREA', adminId, targetId: area.id, targetName: area.name });
    return area;
  }

  async updateArea(
    id: string,
    data: { name?: string; priority?: number; isActive?: boolean },
    adminId: string,
  ) {
    const existing = await this.prisma.area.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Area not found');
    const area = await this.prisma.area.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.priority !== undefined ? { priority: Number(data.priority) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    await this.auditLogService.log({ action: 'UPDATE_AREA', adminId, targetId: area.id, targetName: area.name });
    return area;
  }

  async getStoreBranches(storeId: string) {
    return this.prisma.storeBranch.findMany({
      where: { storeId },
      include: { city: true, area: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createStoreBranch(
    storeId: string,
    data: {
      name: string; address: string; phone?: string; whatsapp?: string;
      lat?: number; lng?: number; locationUrl?: string; workingHours?: string;
      isActive?: boolean; cityId?: string; areaId?: string;
    },
    adminId: string,
  ) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    const branch = await this.prisma.storeBranch.create({
      data: { ...data, storeId, name: data.name.trim(), address: data.address.trim() },
    });
    await this.auditLogService.log({ action: 'CREATE_BRANCH', adminId, targetId: branch.id, targetName: `${store.name} - ${branch.name}` });
    return branch;
  }

  async updateStoreBranch(
    id: string,
    data: {
      name?: string; address?: string; phone?: string; whatsapp?: string;
      lat?: number; lng?: number; locationUrl?: string; workingHours?: string;
      isActive?: boolean; cityId?: string | null; areaId?: string | null;
    },
    adminId: string,
  ) {
    const branch = await this.prisma.storeBranch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    const updated = await this.prisma.storeBranch.update({ where: { id }, data });
    await this.auditLogService.log({ action: 'UPDATE_BRANCH', adminId, targetId: id, targetName: updated.name });
    return updated;
  }

  async deleteStoreBranch(id: string, adminId: string) {
    const branch = await this.prisma.storeBranch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    await this.prisma.storeBranch.delete({ where: { id } });
    await this.auditLogService.log({ action: 'DELETE_BRANCH', adminId, targetId: id, targetName: branch.name });
    return { success: true };
  }

  async getMerchantStats(merchantId: string) {
    return this.prisma.store.findMany({
      where: { ownerId: merchantId },
      include: {
        category: true,
        _count: { select: { offers: true, reviews: true } },
        offers: {
          include: { _count: { select: { coupons: true, favorites: true } } },
        },
      },
    });
  }

  async createStore(payload: StoreCreatePayload) {
    if (!payload.categoryId) {
      throw new BadRequestException('Category is required');
    }
    if (!payload.ownerId) {
      throw new BadRequestException('Owner is required');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: payload.ownerId },
    });
    if (!owner) {
      throw new BadRequestException('Owner not found');
    }

    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone?.trim() || '';
    const duplicate = await this.prisma.store.findFirst({
      where: {
        ownerId: payload.ownerId,
        OR: [
          { name: { equals: normalizedName, mode: 'insensitive' } },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('يوجد متجر بنفس الاسم أو رقم الهاتف لهذا المالك');
    }

    const createdStore = await this.prisma.store.create({
      data: {
        name: normalizedName,
        address: payload.address || '',
        area: payload.area || '',
        phone: normalizedPhone,
        whatsapp: payload.whatsapp || '',
        logo: payload.logo || null,
        coverImage: payload.coverImage || null,
        images: payload.images || [],
        status: payload.status || StoreStatus.APPROVED,
        category: { connect: { id: payload.categoryId } },
        owner: { connect: { id: payload.ownerId } },
      },
    });

    await this.clearCache();
    
    // Notify the merchant that an admin created a store for them
    this.eventsGateway.notifyMerchant(payload.ownerId, {
      type: 'STORE_APPROVED',
      title: 'تم إنشاء متجرك',
      body: `تم إنشاء المتجر "${createdStore.name}" من قبل الإدارة. يمكنك الآن إدارته.`,
      payload: { storeId: createdStore.id, storeName: createdStore.name },
    });

    // Notify other admins that a new store was created
    this.eventsGateway.notifyAdmin({
      type: 'SYSTEM',
      title: 'متجر جديد (عبر الإدارة)',
      body: `تم إضافة متجر "${createdStore.name}" مباشرة من الإدارة.`,
      payload: { storeId: createdStore.id },
    });

    return createdStore;
  }

  async createOffer(payload: UpdateOfferDto, adminId: string) {
    const storeId = payload.storeId!;
    if (!storeId) throw new BadRequestException('Store ID is required');
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');

    if (!payload.title || !payload.description || !payload.discount || !payload.startDate || !payload.endDate) {
      throw new BadRequestException('Missing required fields: title, description, discount, startDate, endDate');
    }

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid dates provided');
    }

    if (payload.images && payload.images.length > 0) {
      this.validateOfferImages(payload.images);
    }

    const offer = await this.prisma.offer.create({
      data: {
        title: payload.title,
        description: payload.description,
        discount: payload.discount,
        discountType: payload.discountType || 'PERCENTAGE',
        terms: payload.terms,
        usageLimit: payload.usageLimit ? +payload.usageLimit : null,
        startDate,
        endDate,
        images: payload.images || [],
        status: OfferStatus.ACTIVE,
        originalPrice: payload.originalPrice ? +payload.originalPrice : null,
        newPrice: payload.newPrice ? +payload.newPrice : null,
        minSpend: payload.minSpend ? +payload.minSpend : null,
        isFeatured: payload.isFeatured ?? false,
        store: { connect: { id: storeId } },
      },
      include: { store: true },
    });

    this.eventsGateway.broadcastNewOffer(offer);

    await this.auditLogService.log({
      action: 'CREATE_OFFER',
      adminId,
      targetId: offer.id,
      targetName: offer.title,
      details: `Created for store: ${store.name}`,
    });

    await this.clearCache();
    return offer;
  }
}
