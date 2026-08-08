import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OfferStatus, Prisma, SubscriptionPaymentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';

export type PlanInput = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  durationDays: number;
  maxStores?: number | null;
  maxActiveOffers?: number | null;
  maxBranches?: number | null;
  maxCouponsPerMonth?: number | null;
  features?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  priority?: number;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private audit: AuditLogService,
  ) {}

  private positiveOrNull(value?: number | null) {
    if (value === undefined || value === null) return null;
    if (!Number.isInteger(value) || value < 1) throw new BadRequestException('Plan limits must be positive integers or empty');
    return value;
  }

  private normalizePlan(data: PlanInput) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Plan name is required');
    if (!Number.isFinite(Number(data.price)) || Number(data.price) < 0) throw new BadRequestException('Plan price cannot be negative');
    if (!Number.isInteger(Number(data.durationDays)) || Number(data.durationDays) < 1) throw new BadRequestException('Plan duration must be at least one day');
    return {
      name,
      description: data.description?.trim() || null,
      price: Number(data.price),
      currency: data.currency?.trim().toUpperCase() || 'EGP',
      durationDays: Number(data.durationDays),
      maxStores: this.positiveOrNull(data.maxStores),
      maxActiveOffers: this.positiveOrNull(data.maxActiveOffers),
      maxBranches: this.positiveOrNull(data.maxBranches),
      maxCouponsPerMonth: this.positiveOrNull(data.maxCouponsPerMonth),
      features: [...new Set((data.features ?? []).map(item => item.trim()).filter(Boolean))],
      isActive: data.isActive ?? true,
      isPublic: data.isPublic ?? true,
      isFeatured: data.isFeatured ?? false,
      priority: Number(data.priority ?? 0),
    };
  }

  async getPublicPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ priority: 'desc' }, { price: 'asc' }],
    });
  }

  async getAdminPlans() {
    return this.prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createPlan(data: PlanInput, adminId: string) {
    const plan = await this.prisma.subscriptionPlan.create({ data: this.normalizePlan(data) });
    await this.audit.log({ action: 'CREATE_SUBSCRIPTION_PLAN', adminId, targetId: plan.id, targetName: plan.name, details: JSON.stringify({ price: plan.price, durationDays: plan.durationDays }) });
    return plan;
  }

  async updatePlan(id: string, data: Partial<PlanInput>, adminId: string) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan not found');
    const merged = this.normalizePlan({
      name: data.name ?? existing.name, description: data.description ?? existing.description ?? undefined,
      price: data.price ?? existing.price, currency: data.currency ?? existing.currency,
      durationDays: data.durationDays ?? existing.durationDays, maxStores: data.maxStores === undefined ? existing.maxStores : data.maxStores,
      maxActiveOffers: data.maxActiveOffers === undefined ? existing.maxActiveOffers : data.maxActiveOffers,
      maxBranches: data.maxBranches === undefined ? existing.maxBranches : data.maxBranches,
      maxCouponsPerMonth: data.maxCouponsPerMonth === undefined ? existing.maxCouponsPerMonth : data.maxCouponsPerMonth,
      features: data.features ?? existing.features, isActive: data.isActive ?? existing.isActive,
      isPublic: data.isPublic ?? existing.isPublic, isFeatured: data.isFeatured ?? existing.isFeatured,
      priority: data.priority ?? existing.priority,
    });
    const plan = await this.prisma.subscriptionPlan.update({ where: { id }, data: merged });
    await this.audit.log({ action: 'UPDATE_SUBSCRIPTION_PLAN', adminId, targetId: plan.id, targetName: plan.name });
    return plan;
  }

  async getSettings() {
    return this.prisma.subscriptionSettings.upsert({ where: { id: 'default' }, create: { id: 'default' }, update: {} });
  }

  async updateSettings(data: { enforcementEnabled?: boolean; allowManualRequests?: boolean; gracePeriodDays?: number; expiryReminderDays?: number; paymentInstructions?: string }, adminId: string) {
    if (data.gracePeriodDays !== undefined && (!Number.isInteger(data.gracePeriodDays) || data.gracePeriodDays < 0)) throw new BadRequestException('Invalid grace period');
    if (data.expiryReminderDays !== undefined && (!Number.isInteger(data.expiryReminderDays) || data.expiryReminderDays < 0)) throw new BadRequestException('Invalid reminder period');
    const settings = await this.prisma.subscriptionSettings.upsert({
      where: { id: 'default' }, create: { id: 'default', ...data, paymentInstructions: data.paymentInstructions?.trim() || null },
      update: { ...data, paymentInstructions: data.paymentInstructions === undefined ? undefined : data.paymentInstructions.trim() || null },
    });
    await this.audit.log({ action: 'UPDATE_SUBSCRIPTION_SETTINGS', adminId, targetId: settings.id, targetName: 'Subscription settings', details: JSON.stringify(data) });
    return settings;
  }

  async getMerchantOverview(merchantId: string) {
    const store = await this.prisma.store.findFirst({ where: { ownerId: merchantId }, orderBy: { createdAt: 'desc' } });
    if (!store) throw new NotFoundException('Store not found');
    const [settings, plans, subscriptions, usage] = await Promise.all([
      this.getSettings(), this.getPublicPlans(),
      this.prisma.storeSubscription.findMany({ where: { storeId: store.id }, include: { plan: true, payments: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.getUsage(store.id),
    ]);
    const active = subscriptions.find(item => item.status === SubscriptionStatus.ACTIVE && item.endsAt && item.endsAt > new Date()) ?? null;
    return { store: { id: store.id, name: store.name }, settings, plans, subscriptions, activeSubscription: active, usage };
  }

  async requestSubscription(merchantId: string, data: { planId: string; merchantNote?: string; paymentReference?: string; proofUrl?: string; paymentMethod?: string }) {
    const [settings, store, plan] = await Promise.all([
      this.getSettings(), this.prisma.store.findFirst({ where: { ownerId: merchantId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.subscriptionPlan.findFirst({ where: { id: data.planId, isActive: true, isPublic: true } }),
    ]);
    if (!settings.allowManualRequests) throw new ForbiddenException('Subscription requests are temporarily disabled');
    if (!store) throw new NotFoundException('Store not found');
    if (!plan) throw new NotFoundException('Plan not found');
    const existing = await this.prisma.storeSubscription.findFirst({ where: { storeId: store.id, status: SubscriptionStatus.PENDING } });
    if (existing) throw new BadRequestException('There is already a pending subscription request');
    return this.prisma.$transaction(async tx => {
      const subscription = await tx.storeSubscription.create({ data: {
        storeId: store.id, planId: plan.id, merchantNote: data.merchantNote?.trim() || null,
        priceSnapshot: plan.price, currencySnapshot: plan.currency, durationDaysSnapshot: plan.durationDays,
        maxStoresSnapshot: plan.maxStores, maxActiveOffersSnapshot: plan.maxActiveOffers,
        maxBranchesSnapshot: plan.maxBranches, maxCouponsSnapshot: plan.maxCouponsPerMonth, featuresSnapshot: plan.features,
      }});
      await tx.subscriptionPayment.create({ data: {
        subscriptionId: subscription.id, amount: plan.price, currency: plan.currency,
        method: data.paymentMethod?.trim() || 'MANUAL', reference: data.paymentReference?.trim() || null,
        proofUrl: data.proofUrl?.trim() || null, merchantNote: data.merchantNote?.trim() || null,
        status: plan.price === 0 ? SubscriptionPaymentStatus.PAID : SubscriptionPaymentStatus.PENDING,
      }});
      return subscription;
    });
  }

  async getAdminSubscriptions(params: { status?: SubscriptionStatus; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1); const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const where = params.status ? { status: params.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.storeSubscription.findMany({ where, include: { store: { include: { owner: { select: { id: true, name: true, phone: true } } } }, plan: true, payments: { orderBy: { createdAt: 'desc' } }, reviewedBy: { select: { id: true, name: true } } }, orderBy: { requestedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.storeSubscription.count({ where }),
    ]);
    return { items, meta: { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) } };
  }

  async reviewSubscription(id: string, data: { status: 'ACTIVE' | 'REJECTED'; note?: string; startsAt?: string; endsAt?: string }, adminId: string) {
    const subscription = await this.prisma.storeSubscription.findUnique({ where: { id }, include: { store: true, payments: true } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status !== SubscriptionStatus.PENDING && subscription.status !== SubscriptionStatus.SUSPENDED) throw new BadRequestException('Subscription cannot be reviewed in its current state');
    const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
    const endsAt = data.endsAt ? new Date(data.endsAt) : new Date(startsAt.getTime() + subscription.durationDaysSnapshot * 86400000);
    if (data.status === 'ACTIVE' && endsAt <= startsAt) throw new BadRequestException('Subscription end date must be after start date');
    const updated = await this.prisma.$transaction(async tx => {
      if (data.status === 'ACTIVE') {
        await tx.storeSubscription.updateMany({ where: { storeId: subscription.storeId, status: SubscriptionStatus.ACTIVE, id: { not: id } }, data: { status: SubscriptionStatus.CANCELLED } });
      }
      const result = await tx.storeSubscription.update({ where: { id }, data: { status: data.status, startsAt: data.status === 'ACTIVE' ? startsAt : null, endsAt: data.status === 'ACTIVE' ? endsAt : null, reviewedAt: new Date(), reviewedById: adminId, reviewNote: data.note?.trim() || null } });
      await tx.subscriptionPayment.updateMany({ where: { subscriptionId: id, status: SubscriptionPaymentStatus.PENDING }, data: { status: data.status === 'ACTIVE' ? SubscriptionPaymentStatus.PAID : SubscriptionPaymentStatus.REJECTED, reviewedAt: new Date(), reviewedById: adminId, reviewNote: data.note?.trim() || null } });
      return result;
    });
    await this.audit.log({ action: data.status === 'ACTIVE' ? 'APPROVE_SUBSCRIPTION' : 'REJECT_SUBSCRIPTION', adminId, targetId: id, targetName: subscription.store.name, details: JSON.stringify({ note: data.note, endsAt: updated.endsAt }) });
    await this.notifications.sendToUserId(subscription.store.ownerId, { title: data.status === 'ACTIVE' ? 'تم تفعيل اشتراك متجرك' : 'تم رفض طلب الاشتراك', body: data.status === 'ACTIVE' ? `اشتراك ${subscription.store.name} مفعل حتى ${updated.endsAt?.toLocaleDateString('ar-EG')}` : data.note || 'راجع لوحة الاشتراك لمعرفة التفاصيل', data: { type: 'SUBSCRIPTION_STATUS', subscriptionId: id } });
    return updated;
  }

  async cancelSubscription(id: string, adminId: string, note?: string) {
    const subscription = await this.prisma.storeSubscription.findUnique({ where: { id }, include: { store: true } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    const updated = await this.prisma.storeSubscription.update({ where: { id }, data: { status: SubscriptionStatus.CANCELLED, reviewNote: note?.trim() || subscription.reviewNote, reviewedById: adminId, reviewedAt: new Date() } });
    await this.audit.log({ action: 'CANCEL_SUBSCRIPTION', adminId, targetId: id, targetName: subscription.store.name, details: note });
    return updated;
  }

  async getUsage(storeId: string) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [activeOffers, branches, couponsThisMonth] = await Promise.all([
      this.prisma.offer.count({ where: { storeId, status: { in: [OfferStatus.ACTIVE, OfferStatus.PENDING] } } }),
      this.prisma.storeBranch.count({ where: { storeId, isActive: true } }),
      this.prisma.coupon.count({ where: { offer: { storeId }, createdAt: { gte: monthStart } } }),
    ]);
    return { activeOffers, branches, couponsThisMonth };
  }

  async getEntitlement(storeId: string) {
    const settings = await this.getSettings();
    if (!settings.enforcementEnabled) return { enforced: false, subscription: null, usage: await this.getUsage(storeId) };
    const subscription = await this.prisma.storeSubscription.findFirst({ where: { storeId, status: SubscriptionStatus.ACTIVE, endsAt: { gt: new Date(Date.now() - settings.gracePeriodDays * 86400000) } }, orderBy: { endsAt: 'desc' } });
    return { enforced: true, subscription, usage: await this.getUsage(storeId) };
  }

  async assertCanCreateOffer(storeId: string) {
    const entitlement = await this.getEntitlement(storeId);
    if (!entitlement.enforced) return;
    if (!entitlement.subscription) throw new ForbiddenException('يلزم اشتراك فعال لإضافة عرض جديد');
    const limit = entitlement.subscription.maxActiveOffersSnapshot;
    if (limit != null && entitlement.usage.activeOffers >= limit) throw new ForbiddenException('وصلت للحد الأقصى من العروض في باقتك');
  }

  async assertCanCreateBranch(storeId: string) {
    const entitlement = await this.getEntitlement(storeId);
    if (!entitlement.enforced) return;
    if (!entitlement.subscription) throw new ForbiddenException('يلزم اشتراك فعال لإضافة فرع جديد');
    const limit = entitlement.subscription.maxBranchesSnapshot;
    if (limit != null && entitlement.usage.branches >= limit) throw new ForbiddenException('وصلت للحد الأقصى من الفروع في باقتك');
  }

  async assertCanCreateStore(ownerId: string) {
    const settings = await this.getSettings();
    if (!settings.enforcementEnabled) return;

    const storesCount = await this.prisma.store.count({ where: { ownerId } });
    // The first store is required to let a new merchant request a subscription.
    if (storesCount === 0) return;

    const subscription = await this.prisma.storeSubscription.findFirst({
      where: {
        store: { ownerId },
        status: SubscriptionStatus.ACTIVE,
        endsAt: {
          gt: new Date(Date.now() - settings.gracePeriodDays * 86400000),
        },
      },
      orderBy: { endsAt: 'desc' },
    });
    if (!subscription) {
      throw new ForbiddenException(
        'يلزم اشتراك فعال لإضافة متجر جديد',
      );
    }
    const limit = subscription.maxStoresSnapshot;
    if (limit != null && storesCount >= limit) {
      throw new ForbiddenException(
        'وصلت للحد الأقصى من المتاجر في باقتك',
      );
    }
  }

  async assertCanGenerateCoupon(storeId: string) {
    const entitlement = await this.getEntitlement(storeId);
    if (!entitlement.enforced) return;
    if (!entitlement.subscription) throw new ForbiddenException('العرض غير متاح مؤقتًا لعدم وجود اشتراك فعال للمتجر');
    const limit = entitlement.subscription.maxCouponsSnapshot;
    if (limit != null && entitlement.usage.couponsThisMonth >= limit) throw new ForbiddenException('وصل المتجر للحد الشهري للكوبونات');
  }

  async expireSubscriptions() {
    const settings = await this.getSettings();
    const expiresBefore = new Date(
      Date.now() - settings.gracePeriodDays * 86400000,
    );
    return this.prisma.storeSubscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endsAt: { lt: expiresBefore },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  async remindExpiringSubscriptions() {
    const settings = await this.getSettings();
    if (settings.expiryReminderDays < 1) return { count: 0 };
    const now = new Date();
    const reminderCutoff = new Date(
      now.getTime() + settings.expiryReminderDays * 86400000,
    );
    const subscriptions = await this.prisma.storeSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiryReminderSentAt: null,
        endsAt: { gt: now, lte: reminderCutoff },
      },
      include: { store: { select: { ownerId: true, name: true } }, plan: { select: { name: true } } },
    });
    for (const subscription of subscriptions) {
      await this.notifications.sendToUserId(subscription.store.ownerId, {
        title: 'اشتراك متجرك أوشك على الانتهاء',
        body: `باقتك ${subscription.plan.name} لمتجر ${subscription.store.name} تنتهي في ${subscription.endsAt?.toLocaleDateString('ar-EG')}`,
        data: { type: 'SUBSCRIPTION_EXPIRING', subscriptionId: subscription.id },
      });
      await this.prisma.storeSubscription.update({
        where: { id: subscription.id },
        data: { expiryReminderSentAt: new Date() },
      });
    }
    return { count: subscriptions.length };
  }
}
