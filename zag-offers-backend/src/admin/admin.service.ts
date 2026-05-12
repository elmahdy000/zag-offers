import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CouponStatus,
  OfferStatus,
  Prisma,
  Role,
  StoreStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

type StoreUpdatePayload = {
  name?: string;
  address?: string;
  area?: string;
  phone?: string;
  whatsapp?: string;
  logo?: string;
  coverImage?: string;
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
  status?: StoreStatus;
};

type OfferUpdatePayload = {
  title?: string;
  description?: string;
  discount?: string;
  terms?: string;
  startDate?: string;
  endDate?: string;
  usageLimit?: number | null;
  status?: OfferStatus;
  storeId?: string;
  images?: string[];
};

type OfferCreatePayload = {
  title: string;
  description: string;
  discount: string;
  storeId: string;
  startDate: string;
  endDate: string;
  images: string[];
  terms?: string;
  usageLimit?: number;
};

@Injectable()
export class AdminService {
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
  ) {}

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
    ]);

    const couponConversionRate =
      totalCouponsGenerated > 0
        ? Math.round((totalCouponsUsed / totalCouponsGenerated) * 100)
        : 0;

    return {
      users: { totalUsers, totalMerchants },
      stores: { totalStores, pendingStores, approvedStores },
      offers: { totalOffers, activeOffers, pendingOffers, expiredOffers },
      coupons: {
        totalCouponsGenerated,
        totalCouponsUsed,
        couponConversionRate: `${couponConversionRate}%`,
      },
      engagement: { totalFavorites, totalReviews },
    };
  }

  async getStatsByPeriod(period: 'today' | 'week' | 'month') {
    const now = new Date();
    let from: Date;

    if (period === 'today') {
      from = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      from = new Date(now.setDate(now.getDate() - 7));
    } else {
      from = new Date(now.setMonth(now.getMonth() - 1));
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
        totalOffers: category.stores.reduce(
          (sum, store) => sum + store._count.offers,
          0,
        ),
      }))
      .sort((a, b) => b.totalOffers - a.totalOffers);
  }

  async getTopStores(limit = 10) {
    const stores = await this.prisma.store.findMany({
      where: { status: StoreStatus.APPROVED },
      include: {
        category: { select: { name: true } },
        _count: { select: { offers: true, reviews: true } },
        offers: {
          include: {
            _count: {
              select: {
                coupons: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: { reviews: { _count: 'desc' } },
    });

    // Calculate total redemptions (USED coupons) for each store
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
          totalCoupons: redeemedCount, // This matches the field expected by the Admin Dashboard
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
        _count: { select: { offers: true, reviews: true } },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
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

    return this.prisma.store.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.area !== undefined ? { area: payload.area } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.whatsapp !== undefined
          ? { whatsapp: payload.whatsapp }
          : {}),
        ...(payload.logo !== undefined ? { logo: payload.logo } : {}),
        ...(payload.coverImage !== undefined
          ? { coverImage: payload.coverImage }
          : {}),
        ...(payload.categoryId !== undefined
          ? { categoryId: payload.categoryId }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
      include: {
        category: true,
        owner: { select: { id: true, name: true, phone: true, email: true } },
        _count: { select: { offers: true, reviews: true } },
      },
    });
  }

  async approveStore(id: string, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.status === StoreStatus.APPROVED) {
      throw new BadRequestException('Store is already approved');
    }

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: StoreStatus.APPROVED },
      include: { owner: true, category: true },
    });

    this.eventsGateway.notifyMerchant(store.ownerId, {
      type: 'STORE_APPROVED',
      title: 'Store approved',
      body: `Your store "${store.name}" has been approved.`,
      payload: { storeId: store.id, storeName: store.name },
    });

    void this.notificationsService.sendToUserId(store.ownerId, {
      title: 'تم اعتماد متجرك بنجاح ✅',
      body: `تمت الموافقة على "${store.name}". يمكنك الآن البدء في إضافة عروضك.`,
      data: { storeId: store.id, type: 'STORE_APPROVED' },
    });

    // Log the action
    await this.auditLogService.log({
      action: 'APPROVE_STORE',
      adminId,
      targetId: id,
      targetName: store.name,
    });

    return updated;
  }

  async rejectStore(id: string, adminId: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const updated = await this.prisma.store.update({
      where: { id },
      data: { status: StoreStatus.REJECTED },
      include: { owner: true },
    });

    this.eventsGateway.notifyMerchant(store.ownerId, {
      type: 'STORE_REJECTED',
      title: 'Store rejected',
      body: reason || 'The store request was rejected.',
      payload: { storeId: store.id, storeName: store.name },
    });

    void this.notificationsService.sendToUserId(store.ownerId, {
      title: 'تم رفض طلب المتجر ❌',
      body: reason || `تم رفض طلب "${store.name}". تواصل مع الدعم للمزيد.`,
      data: { storeId: store.id, type: 'STORE_REJECTED' },
    });

    await this.auditLogService.log({
      action: 'REJECT_STORE',
      adminId,
      targetId: id,
      targetName: store.name,
      details: reason,
    });

    return updated;
  }

  async suspendStore(id: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { owner: true },
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
      title: 'تم إيقاف المتجر',
      body: reason || 'تم إيقاف المتجر مؤقتاً من قبل الإدارة.',
      payload: { storeId: store.id, storeName: store.name },
    });

    if (store.owner.fcmToken) {
      void this.notificationsService.sendToUser(
        store.owner.fcmToken,
        'تم إيقاف المتجر',
        reason || 'تم إيقاف المتجر مؤقتاً من قبل الإدارة.',
        { storeId: store.id, type: 'STORE_SUSPENDED' },
      );
    }

    return updated;
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return this.prisma.store.delete({ where: { id } });
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
          _count: { select: { coupons: true } },
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
        _count: { select: { coupons: true } },
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
        _count: { select: { coupons: true, favorites: true, reviews: true } },
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
        _count: { select: { coupons: true } },
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

    // Notify merchant about the update
    if (updated.store?.ownerId) {
      this.eventsGateway.notifyMerchant(updated.store.ownerId, {
        type: 'OFFER_UPDATED',
        title: 'تم تعديل العرض',
        body: `تم تعديل عرض "${updated.title}" من قبل الإدارة.`,
        payload: { offerId: updated.id, offerTitle: updated.title },
      });

      if (updated.store.owner.fcmToken) {
        void this.notificationsService.sendToUser(
          updated.store.owner.fcmToken,
          'تم تعديل العرض',
          `تم تعديل عرض "${updated.title}" من قبل الإدارة.`,
          { offerId: updated.id, type: 'OFFER_UPDATED' },
        );
      }
    }

    return updated;
  }

  async approveOffer(id: string, adminId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: { include: { owner: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status === OfferStatus.ACTIVE) {
      throw new BadRequestException('Offer is already active');
    }

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.ACTIVE },
      include: { store: true },
    });

    this.eventsGateway.broadcastNewOffer(updated);

    const imageUrl =
      offer.images && offer.images.length > 0 ? offer.images[0] : undefined;

    void this.notificationsService.sendToAll(
      `${offer.store.name} 🎁`,
      `عرض جديد متاح الآن: "${offer.title}"`,
      { offerId: offer.id, type: 'NEW_OFFER' },
      imageUrl,
    );

    void this.notificationsService.sendToUserId(offer.store.ownerId, {
      title: 'تم اعتماد عرضك بنجاح ✅',
      body: `عرضك "${offer.title}" متاح الآن لجميع العملاء.`,
      data: { offerId: offer.id, type: 'OFFER_APPROVED' },
      imageUrl,
    });

    await this.auditLogService.log({
      action: 'APPROVE_OFFER',
      adminId,
      targetId: id,
      targetName: offer.title,
    });

    return updated;
  }

  async rejectOffer(id: string, adminId: string, reason?: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { store: { include: { owner: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status: OfferStatus.REJECTED },
      include: { store: true },
    });

    this.eventsGateway.notifyMerchant(offer.store.ownerId, {
      type: 'OFFER_REJECTED',
      title: 'Offer rejected',
      body: reason || 'The offer was rejected by admin.',
      payload: { offerId: offer.id, offerTitle: offer.title },
    });

    void this.notificationsService.sendToUserId(offer.store.ownerId, {
      title: 'تم رفض العرض ❌',
      body: reason || `تم رفض عرضك "${offer.title}". تواصل مع الدعم للمزيد.`,
      data: { offerId: offer.id, type: 'OFFER_REJECTED' },
    });

    await this.auditLogService.log({
      action: 'REJECT_OFFER',
      adminId,
      targetId: id,
      targetName: offer.title,
      details: reason,
    });

    return updated;
  }

  async deleteOffer(id: string, adminId?: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    const deleted = await this.prisma.offer.delete({ where: { id } });

    if (adminId) {
      await this.auditLogService.log({
        action: 'DELETE_OFFER',
        adminId,
        targetId: id,
        targetName: offer.title,
      });
    }

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

    const [items, total] = await Promise.all([
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
          _count: { select: { stores: true, coupons: true, favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  async createUser(data: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new BadRequestException('User with this phone already exists');
      }

      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : await bcrypt.hash('123456', 10); // Default password

      return await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      if (error instanceof BadRequestException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create user: ' + errorMessage);
    }
  }

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      if (data.phone && data.phone !== user.phone) {
        const existing = await this.prisma.user.findUnique({
          where: { phone: data.phone },
        });
        if (existing)
          throw new BadRequestException('Phone number already in use');
      }

      const { password, ...updateData } = data;
      const finalData: Prisma.UserUpdateInput = { ...updateData };

      if (password) {
        finalData.password = await bcrypt.hash(password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data: finalData,
      });
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      if (
        error instanceof BadRequestException ||
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
        stores: {
          include: { _count: { select: { offers: true } } },
        },
        coupons: {
          include: { offer: { select: { title: true } } },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changeUserRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { stores: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot delete an admin account');
    }

    // Manual cascade deletion to avoid foreign key constraints
    return this.prisma.$transaction(async (tx) => {
      // 1. If merchant, handle stores and their nested offers/coupons
      if (user.stores.length > 0) {
        const storeIds = user.stores.map((s) => s.id);

        // Delete all offers images/coupons/favorites associated with this merchant's stores
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

      // 2. Cleanup customer specific data
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { customerId: id } });
      await tx.coupon.deleteMany({ where: { customerId: id } });

      // 3. Finally delete the user
      return tx.user.delete({ where: { id } });
    });
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { stores: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(name: string, adminId?: string) {
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
      data: { name: normalizedName },
    });

    if (adminId) {
      await this.auditLogService.log({
        action: 'CREATE_CATEGORY',
        adminId,
        targetId: created.id,
        targetName: created.name,
      });
    }

    return created;
  }

  async updateCategory(id: string, name: string, adminId?: string) {
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
      data: { name: normalizedName },
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
    adminId: string;
  }) {
    const { title, body, area, imageUrl, adminId } = params;
    if (area) {
      await this.notificationsService.sendToArea(
        area,
        title,
        body,
        {
          type: 'ANNOUNCEMENT',
        },
        imageUrl,
      );
    } else {
      await this.notificationsService.sendToAll(
        title,
        body,
        {
          type: 'ANNOUNCEMENT',
        },
        imageUrl,
      );
    }

    this.eventsGateway.broadcastNewOffer({
      type: 'ANNOUNCEMENT',
      title,
      body,
      area,
    });

    await this.auditLogService.log({
      action: 'SEND_BROADCAST',
      adminId,
      details: `Title: ${title}, Area: ${area || 'All Users'}`,
    });
    return {
      success: true,
      message: area
        ? `Announcement sent to area ${area}`
        : 'Announcement sent to all users',
    };
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

    return this.prisma.store.create({
      data: {
        name: payload.name,
        address: payload.address || '',
        area: payload.area || '',
        phone: payload.phone || '',
        whatsapp: payload.whatsapp || '',
        logo: payload.logo || null,
        coverImage: payload.coverImage || null,
        status: payload.status || StoreStatus.APPROVED,
        category: { connect: { id: payload.categoryId } },
        owner: { connect: { id: payload.ownerId } },
      },
    });
  }

  async createOffer(payload: OfferCreatePayload, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: payload.storeId },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');

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
        terms: payload.terms,
        usageLimit: payload.usageLimit ? +payload.usageLimit : null,
        startDate,
        endDate,
        images: payload.images || [],
        status: OfferStatus.ACTIVE, // Admin offers are approved by default
        store: { connect: { id: payload.storeId } },
      },
      include: { store: true },
    });

    // Notify users about new offer
    this.eventsGateway.broadcastNewOffer(offer);

    const imageUrl =
      offer.images && offer.images.length > 0 ? offer.images[0] : undefined;

    void this.notificationsService.sendToAll(
      `${store.name} 🎁`,
      `تمت إضافة عرض جديد: ${offer.title}`,
      { offerId: offer.id, type: 'NEW_OFFER' },
      imageUrl,
    );

    await this.auditLogService.log({
      action: 'CREATE_OFFER',
      adminId,
      targetId: offer.id,
      targetName: offer.title,
      details: `Created for store: ${store.name}`,
    });

    return offer;
  }
}
