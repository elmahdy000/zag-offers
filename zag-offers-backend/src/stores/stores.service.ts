import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, Store, StoreStatus } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(data: Prisma.StoreCreateInput): Promise<Store> {
    return this.prisma.store.create({
      data,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StoreWhereUniqueInput;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput;
  }): Promise<any[]> {
    const { skip, take, cursor, where, orderBy } = params;
    // دائماً نُرجع المحلات المعتمدة فقط ما لم يُحدَّد خلاف ذلك صراحةً
    const finalWhere: Prisma.StoreWhereInput = {
      status: StoreStatus.APPROVED,
      ...where,
    };
    return this.prisma.store.findMany({
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
      throw new Error('لا يوجد محل مرتبط بهذا التاجر');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeOffers, scansToday, recentCoupons] = await Promise.all([
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
      this.prisma.coupon.findMany({
        where: {
          offer: { storeId: store.id },
          status: 'USED',
        },
        orderBy: { redeemedAt: 'desc' },
        take: 5,
        include: { customer: true, offer: true },
      }),
    ]);

    return {
      activeOffers,
      scansToday,
      recentCoupons,
    };
  }

  async update(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
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
          body: `مبروك! تم قبول "${store.name}" — يمكنك الآن إضافة عروضك.`,
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
    if (!store) throw new Error('المحل غير موجود');
    if (store.ownerId !== merchantId)
      throw new Error('غير مصرح لك بتعديل هذا المحل');
    return this.prisma.store.update({ where: { id: storeId }, data });
  }
}
