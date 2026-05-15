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
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
    private analyticsService: AnalyticsService,
  ) {}

  async generate(offerId: string, customerId: string): Promise<Coupon> {
    // Validate input parameters
    if (!offerId || !customerId) {
      throw new BadRequestException('بيانات غير كاملة');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { store: true },
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

    // Check if user has too many active coupons (prevent abuse)
    const activeCouponCount = await this.prisma.coupon.count({
      where: {
        customerId,
        status: CouponStatus.GENERATED,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeCouponCount >= 10) {
      throw new BadRequestException('لديك الحد الأقصى من الكوبونات النشطة');
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

    const code = `ZAG-${nanoid(8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Increased to 24 hours for better UX

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

    void this.analyticsService.logEvent({
      userId: customerId,
      offerId,
      storeId: offer.storeId,
      eventType: 'COUPON_GENERATE',
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
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('عفواً، الكود ده مش صحيح');
    }

    // التحقق من أن العرض لا يزال نشطاً
    if (coupon.offer.status !== OfferStatus.ACTIVE) {
      throw new BadRequestException('عفواً، العرض ده مش متاح حالياً');
    }

    // التحقق من تاريخ انتهاء العرض
    if (coupon.offer.endDate && new Date() > coupon.offer.endDate) {
      throw new BadRequestException('عفواً، العرض ده انتهت صلاحيته');
    }

    // التحقق من أن التاجر هو صاحب المحل فعلاً أو أدمن
    const isOwner = coupon.offer.store.ownerId === merchantId;
    const user = await this.prisma.user.findUnique({
      where: { id: merchantId },
      select: { role: true, fcmToken: true },
    });
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('عفواً، المحل ده مش مسجل باسمك');
    }

    // إذا تم إرسال storeId، نتأكد أنه يخص نفس المحل الخاص بالكوبون
    if (storeId && coupon.offer.storeId !== storeId) {
      throw new BadRequestException('عفواً، الكوبون ده مش خاص بالمحل ده');
    }

    // التحقق من حالة الكوبون
    if (coupon.status === CouponStatus.USED) {
      throw new BadRequestException('الكوبون ده تم استخدامه قبل كدة');
    }

    if (coupon.status === CouponStatus.EXPIRED) {
      throw new BadRequestException('عفواً، صلاحية الكوبون ده انتهت');
    }

    if (coupon.status !== CouponStatus.GENERATED) {
      throw new BadRequestException('حالة الكوبون غير صالحة للتفعيل');
    }

    // التحقق من انتهاء صلاحية الكوبون (24 hours)
    if (new Date() > coupon.expiresAt) {
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: CouponStatus.EXPIRED },
      });
      throw new BadRequestException('عفواً، صلاحية الكوبون ده انتهت (24 ساعة)');
    }

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        status: CouponStatus.USED,
        redeemedAt: new Date(),
      },
      include: {
        offer: {
          include: { store: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
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
      body: `تم تفعيل الكوبون ${coupon.code} بنجاح للعميل ${coupon.customer?.name || 'غير معروف'}`,
      payload: {
        couponId: updatedCoupon.id,
        code: updatedCoupon.code,
        customerName: coupon.customer?.name,
        customerPhone: coupon.customer?.phone,
      },
    });

    // إرسال Push Notification للتاجر
    if (user?.fcmToken) {
      void this.notificationsService.sendToUser(
        user.fcmToken,
        'تم تفعيل الكوبون! ✅',
        `تم تفعيل الكوبون ${updatedCoupon.code} للعميل ${coupon.customer?.name || 'غير معروف'}`,
        {
          couponId: updatedCoupon.id,
          type: 'COUPON_REDEEMED',
          customerName: coupon.customer?.name,
        },
      );
    }

    // Log the redemption for admin visibility
    void this.auditLogService.log({
      action: 'REDEEM_COUPON',
      adminId: merchantId,
      targetId: updatedCoupon.id,
      targetName: updatedCoupon.code,
      details: `Merchant ${merchantId} redeemed coupon ${code} for customer ${coupon.customerId}`,
    });

    // Log analytics event
    void this.analyticsService.logEvent({
      userId: coupon.customerId,
      offerId: coupon.offerId,
      storeId: coupon.offer.storeId,
      eventType: 'COUPON_REDEEM',
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
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCode(code: string, requesterId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true,
            endDate: true,
            store: {
              select: { id: true, ownerId: true, name: true },
            },
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('الكود غير صحيح');
    }

    const isAdmin = requester?.role === 'ADMIN';
    const isStoreOwner = coupon.offer.store.ownerId === requesterId;
    if (!isAdmin && !isStoreOwner) {
      throw new BadRequestException('عفواً، الكوبون ده مش خاص بمتجرك');
    }

    return coupon;
  }

  async notifyShare(couponId: string, customerId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        offer: { include: { store: true } },
        customer: { select: { name: true } },
      },
    });

    if (!coupon || coupon.customerId !== customerId) {
      throw new NotFoundException('الكوبون غير موجود');
    }

    // إرسال تنبيه لحظي للتاجر لتنبيهه بوجود رسالة واتساب
    this.eventsGateway.notifyMerchant(coupon.offer.store.ownerId, {
      type: 'COUPON_SHARED',
      title: 'محاولة تفعيل عبر واتساب 💬',
      body: `العميل ${coupon.customer.name} شارك الكوبون ${coupon.code} معك.`,
      payload: { code: coupon.code, customerName: coupon.customer.name },
    });

    // إرسال Push Notification للتاجر
    void this.notificationsService.sendToUserId(coupon.offer.store.ownerId, {
      title: '💬 كوبون شاركه عميل!',
      body: `العميل ${coupon.customer.name} أرسل لك كوبوناً عبر واتساب.`,
      data: { type: 'COUPON_SHARED', code: coupon.code },
    });

    return { success: true };
  }

  async checkVerification(offerId: string, customerId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        offerId,
        customerId,
        // Any status means they have "experienced" the offer flow
        status: { in: [CouponStatus.GENERATED, CouponStatus.USED] },
      },
    });

    return { isVerified: !!coupon };
  }
}
