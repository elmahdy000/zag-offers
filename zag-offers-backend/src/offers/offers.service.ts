import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Offer, OfferStatus, StoreStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  async getStoreByOwnerId(ownerId: string) {
    return this.prisma.store.findFirst({
      where: { ownerId },
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

    // التحقق من تاريخ انتهاء العرض
    const endDate =
      data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    if (endDate < new Date()) {
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

    return offer;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OfferWhereInput;
    orderBy?: Prisma.OfferOrderByWithRelationInput;
  }): Promise<unknown[]> {
    const { skip, take, where, orderBy } = params;

    // الفلاتر الأمنية ثابتة دايمًا — لا يمكن تجاوزها عبر where الخارجي
    // نستخرج فقط الفلاتر المسموح بيها (categoryId, area, search) ونمنع تعديل status أو store.status
    const whereObj = where || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, store, ...safeWhere } = whereObj as {
      status?: unknown;
      store?: unknown;
      [key: string]: unknown;
    };

    const finalWhere: Prisma.OfferWhereInput = {
      ...safeWhere,
      status: OfferStatus.ACTIVE, // دايمًا ACTIVE فقط
      store: { status: StoreStatus.APPROVED }, // من محلات معتمدة فقط
    };

    return this.prisma.offer.findMany({
      skip,
      take,
      where: finalWhere,
      orderBy,
      select: {
        id: true,
        title: true,
        discount: true,
        endDate: true,
        status: true,
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
      },
    });
  }

  async findMerchantOffers(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error('Store not found for this user');
    }

    return this.prisma.offer.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: { store: true },
    });
  }

  async findOne(id: string): Promise<Offer | null> {
    // نعرض العرض بس لو ACTIVE من محل APPROVED
    return this.prisma.offer.findFirst({
      where: {
        id,
        status: OfferStatus.ACTIVE,
        store: { status: StoreStatus.APPROVED },
      },
      include: { store: true },
    });
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

    return this.prisma.offer.update({
      where: { id },
      data: updateData,
    });
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

    return this.prisma.offer.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { status },
      include: { store: true },
    });

    if (status === OfferStatus.ACTIVE) {
      // 1. التحديث اللحظي للمتصلين حالياً
      this.eventsGateway.broadcastNewOffer(offer);

      // 2. الإشعارات تم نقلها لتعمل بشكل مجمع (Batching) في TasksService
      // لمنع إزعاج المستخدمين بكثرة الإشعارات
    } else if (status === OfferStatus.REJECTED) {
      this.eventsGateway.notifyMerchant(offer.store.ownerId, {
        type: 'OFFER_REJECTED',
        title: 'تم رفض عرضك',
        body: 'عذراً، تم رفض عرضك. برجاء مراجعة الشروط والأحكام',
        payload: { offerId: offer.id, offerTitle: offer.title },
      });
    }

    return offer;
  }
}
