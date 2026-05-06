import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { UploadService } from '../upload/upload.service';
import { Prisma, Store, StoreStatus } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private uploadService: UploadService,
  ) {}

  async create(data: Prisma.StoreCreateInput): Promise<Store> {
    const store = await this.prisma.store.create({
      data,
    });

    if (store.status === StoreStatus.PENDING) {
      this.events.notifyAdmin({
        type: 'NEW_PENDING_STORE',
        title: 'طلب تاجر جديد بانتظار المراجعة',
        body: `تم إنشاء متجر جديد: ${store.name}`,
        payload: { storeId: store.id, storeName: store.name },
      });
    }

    return store;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StoreWhereUniqueInput;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput;
    includeMeta?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any[] | { items: any[]; meta: any }> {
    const { skip, take, cursor, where, orderBy, includeMeta, page, limit } =
      params;
    // Always return approved stores unless a controller explicitly narrows it.
    const finalWhere: Prisma.StoreWhereInput = {
      status: StoreStatus.APPROVED,
      ...where,
    };
    const items = await this.prisma.store.findMany({
      skip,
      take,
      cursor,
      where: finalWhere,
      orderBy,
      select: {
        id: true,
        name: true,
        logo: true,
        area: true,
        lat: true,
        lng: true,
        status: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    if (!includeMeta) {
      return items;
    }

    const total = await this.prisma.store.count({ where: finalWhere });
    const currentLimit = limit ?? take ?? 10;
    const currentPage = page ?? 1;

    return {
      items,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        lastPage: Math.max(1, Math.ceil(total / currentLimit)),
      },
    };
  }

  async findOne(id: string): Promise<Store | null> {
    return this.prisma.store.findUnique({
      where: { id },
      include: { category: true, owner: true, offers: true },
    });
  }

  async getVendorDashboardStats(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new NotFoundException('لا يوجد محل مرتبط بهذا التاجر');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeOffers, scansToday, claimsToday, totalClaims, recentCoupons] =
      await Promise.all([
        this.prisma.offer.count({
          where: { storeId: store.id, status: 'ACTIVE' },
        }),
        this.prisma.coupon.count({
          where: {
            offer: { storeId: store.id },
            status: 'USED',
            redeemedAt: { gte: startOfDay },
          },
        }),
        this.prisma.coupon.count({
          where: {
            offer: { storeId: store.id },
            createdAt: { gte: startOfDay },
          },
        }),
        this.prisma.coupon.count({
          where: {
            offer: { storeId: store.id },
          },
        }),
        this.prisma.coupon.findMany({
          where: {
            offer: { storeId: store.id },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { customer: true, offer: true },
        }),
      ]);

    return {
      storeName: store.name,
      storeId: store.id,
      storeStatus: store.status,
      activeOffers,
      scansToday,
      claimsToday,
      totalClaims,
      recentCoupons: recentCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        createdAt: c.createdAt,
        redeemedAt: c.redeemedAt,
        offerTitle: c.offer.title,
        customerName: c.customer.name,
      })),
    };
  }

  async update(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('المحل غير موجود');

    // تنظيف اللوجو القديم
    if (data.logo && typeof data.logo === 'string' && store.logo && data.logo !== store.logo) {
      await this.uploadService.deleteImage(store.logo);
    }
    
    // تنظيف صورة الغلاف القديمة
    if (data.coverImage && typeof data.coverImage === 'string' && store.coverImage && data.coverImage !== store.coverImage) {
      await this.uploadService.deleteImage(store.coverImage);
    }

    return this.prisma.store.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: StoreStatus): Promise<Store> {
    const store = await this.prisma.store.update({
      where: { id },
      data: { status },
      include: { owner: { select: { id: true } } },
    });

    const ownerId = store.owner?.id;
    if (ownerId) {
      if (status === StoreStatus.APPROVED) {
        this.events.notifyMerchant(ownerId, {
          type: 'STORE_APPROVED',
          title: 'تم اعتماد متجرك!',
          body: `مبروك! تم قبول "${store.name}" - يمكنك الآن إضافة عروضك.`,
          payload: { storeId: store.id, storeName: store.name },
        });
      } else if (status === StoreStatus.REJECTED) {
        this.events.notifyMerchant(ownerId, {
          type: 'STORE_REJECTED',
          title: 'تم رفض طلب متجرك',
          body: 'تم رفض طلب متجرك. تواصل مع الإدارة لمزيد من التفاصيل.',
          payload: { storeId: store.id, storeName: store.name },
        });
      }
    }

    return this.prisma.store.findUniqueOrThrow({ where: { id } });
  }

  async findCategories() {
    return this.prisma.category.findMany();
  }

  async createCategory(name: string) {
    return this.prisma.category.create({
      data: { name },
    });
  }

  async updateStoreDetails(
    storeId: string,
    merchantId: string,
    data: Prisma.StoreUpdateInput,
  ): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('المحل غير موجود');
    if (store.ownerId !== merchantId) {
      throw new ForbiddenException('غير مصرح لك بتعديل هذا المحل');
    }
    return this.prisma.store.update({ where: { id: storeId }, data });
  }
}
