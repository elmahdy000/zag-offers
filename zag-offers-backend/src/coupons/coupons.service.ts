import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Coupon, CouponStatus, OfferStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
  ) {}

  async generate(offerId: string, customerId: string): Promise<Coupon> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('عفواً، العرض ده مش موجود حالياً');
    }

    // التحقق من أن العرض ACTIVE — لا يجوز توليد كوبون لعرض غير معتمد أو منتهي
    if (offer.status !== OfferStatus.ACTIVE) {
      throw new BadRequestException('عفواً، العرض ده مش متاح حالياً');
    }

    // التحقق من تاريخ انتهاء العرض
    if (offer.endDate && new Date() > offer.endDate) {
      throw new BadRequestException('عفواً، العرض ده انتهت صلاحيته');
    }

    // التحقق من usageLimit — لو العرض له حد أقصى
    if (offer.usageLimit !== null && offer.usageLimit !== undefined) {
      const usedCount = await this.prisma.coupon.count({
        where: {
          offerId,
          status: { in: [CouponStatus.GENERATED, CouponStatus.USED] },
        },
      });
      if (usedCount >= offer.usageLimit) {
        throw new BadRequestException('عفواً، العرض ده وصل لأقصى عدد استخدام');
      }
    }

    // لو العميل عنده كوبون صالح بالفعل، نرجع نفس الكوبون بدل ما نعمل واحد جديد
    const existing = await this.prisma.coupon.findFirst({
      where: {
        offerId,
        customerId,
        status: CouponStatus.GENERATED,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return existing;
    }

    const code = `ZAG-${nanoid(6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    const newCoupon = await this.prisma.coupon.create({
      data: {
        code,
        expiresAt,
        offer: { connect: { id: offerId } },
        customer: { connect: { id: customerId } },
      },
      include: { offer: { include: { store: true } } },
    });

    // بث اجتماعي لحظي لزيادة الحماس
    this.eventsGateway.broadcastSocialProof({
      storeName: newCoupon.offer.store.name,
      offerTitle: newCoupon.offer.title,
    });

    // إشعار التاجر بحصول عميل على كوبون جديد
    this.eventsGateway.notifyMerchant(newCoupon.offer.store.ownerId, {
      type: 'COUPON_GENERATED',
      title: 'كوبون جديد مستخرج!',
      body: `عميل حصل على كوبون لعرض: ${newCoupon.offer.title}`,
      payload: { code: newCoupon.code, offerTitle: newCoupon.offer.title },
    });

    // إرسال Push Notification حقيقية للتاجر
    void this.notificationsService.sendToUserId(newCoupon.offer.store.ownerId, {
      title: '🎟️ كوبون جديد مستخرج!',
      body: `عميل حصل على كوبون لعرض: ${newCoupon.offer.title}`,
      data: { type: 'COUPON_GENERATED', code: newCoupon.code },
    });

    // Log the generation for admin visibility
    void this.auditLogService.log({
      action: 'GENERATE_COUPON',
      adminId: customerId,
      targetId: newCoupon.id,
      targetName: newCoupon.code,
      details: `Customer ${customerId} generated coupon for offer ${offerId}`,
    });

    return newCoupon;
  }

  async redeem(
    code: string,
    storeId: string | null,
    merchantId: string,
  ): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        offer: {
          include: { store: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('عفواً، الكود ده مش صحيح');
    }

    // إذا لم يتم إرسال storeId، نأخذ الـ storeId الخاص بالمحل المرتبط بالتاجر
    if (!storeId) {
      const merchantStore = await this.prisma.store.findFirst({
        where: { ownerId: merchantId },
      });
      if (!merchantStore) {
        throw new BadRequestException('عفواً، لا يوجد محل مسجل باسمك');
      }
      storeId = merchantStore.id;
    }

    // التحقق من أن التاجر هو صاحب المحل فعلاً
    if (coupon.offer.store.ownerId !== merchantId) {
      const user = await this.prisma.user.findUnique({
        where: { id: merchantId },
      });
      if (user?.role !== 'ADMIN' && coupon.offer.store.ownerId !== merchantId) {
        throw new BadRequestException('عفواً، المحل ده مش مسجل باسمك');
      }
    }

    if (coupon.offer.storeId !== storeId) {
      throw new BadRequestException('عفواً، الكوبون ده مش خاص بالمحل ده');
    }

    if (coupon.status !== CouponStatus.GENERATED) {
      throw new BadRequestException('الكوبون ده تم استخدامه قبل كدة');
    }

    if (new Date() > coupon.expiresAt) {
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: CouponStatus.EXPIRED },
      });
      throw new BadRequestException('عفواً، صلاحية الكوبون ده انتهت (ساعتين)');
    }

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        status: CouponStatus.USED,
        redeemedAt: new Date(),
      },
    });

    // إرسال تنبيه لحظي للعميل فوراً
    this.eventsGateway.notifyCouponStatus(coupon.customerId, {
      status: 'USED',
      code: coupon.code,
      offerTitle: coupon.offer.title,
      storeName: coupon.offer.store.name,
    });

    // إرسال تنبيه لحظي للتاجر لتحديث الإحصائيات
    this.eventsGateway.notifyMerchant(merchantId, {
      type: 'COUPON_REDEEMED',
      title: 'تم التفعيل!',
      body: `تم تفعيل الكوبون ${coupon.code} بنجاح`,
    });

    // Log the redemption for admin visibility
    void this.auditLogService.log({
      action: 'REDEEM_COUPON',
      adminId: merchantId,
      targetId: updatedCoupon.id,
      targetName: updatedCoupon.code,
      details: `Merchant ${merchantId} redeemed coupon ${code}`,
    });

    return updatedCoupon;
  }

  async findAll(customerId: string) {
    return this.prisma.coupon.findMany({
      where: { customerId },
      include: { offer: { include: { store: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMerchantCoupons(merchantId: string) {
    return this.prisma.coupon.findMany({
      where: {
        offer: {
          store: { ownerId: merchantId },
        },
      },
      include: {
        offer: true,
        customer: {
          select: {
            name: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
