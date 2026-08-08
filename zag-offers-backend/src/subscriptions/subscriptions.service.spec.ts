import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const prisma = {
    subscriptionSettings: { upsert: jest.fn() }, subscriptionPlan: { create: jest.fn() },
    storeSubscription: { findFirst: jest.fn() }, store: { count: jest.fn() }, offer: { count: jest.fn() },
    storeBranch: { count: jest.fn() }, coupon: { count: jest.fn() },
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({ providers: [
      SubscriptionsService, { provide: PrismaService, useValue: prisma },
      { provide: NotificationsService, useValue: { sendToUserId: jest.fn() } },
      { provide: AuditLogService, useValue: { log: jest.fn() } },
    ] }).compile();
    service = module.get(SubscriptionsService);
    prisma.offer.count.mockResolvedValue(0); prisma.storeBranch.count.mockResolvedValue(0); prisma.coupon.count.mockResolvedValue(0);
    prisma.store.count.mockResolvedValue(0);
  });

  it('rejects invalid plan prices', async () => {
    await expect(service.createPlan({ name: 'Test', price: -1, durationDays: 30 }, 'admin')).rejects.toThrow(BadRequestException);
  });

  it('does not enforce limits while enforcement is disabled', async () => {
    prisma.subscriptionSettings.upsert.mockResolvedValue({ enforcementEnabled: false });
    await expect(service.assertCanCreateOffer('store')).resolves.toBeUndefined();
  });

  it('requires active subscription when enforcement is enabled', async () => {
    prisma.subscriptionSettings.upsert.mockResolvedValue({ enforcementEnabled: true, gracePeriodDays: 0 });
    prisma.storeSubscription.findFirst.mockResolvedValue(null);
    await expect(service.assertCanCreateOffer('store')).rejects.toThrow(ForbiddenException);
  });

  it('enforces active offer snapshot limit', async () => {
    prisma.subscriptionSettings.upsert.mockResolvedValue({ enforcementEnabled: true, gracePeriodDays: 0 });
    prisma.storeSubscription.findFirst.mockResolvedValue({ status: SubscriptionStatus.ACTIVE, maxActiveOffersSnapshot: 1 });
    prisma.offer.count.mockResolvedValue(1);
    await expect(service.assertCanCreateOffer('store')).rejects.toThrow(ForbiddenException);
  });

  it('allows the first store so a merchant can request a subscription', async () => {
    prisma.subscriptionSettings.upsert.mockResolvedValue({ enforcementEnabled: true, gracePeriodDays: 0 });
    await expect(service.assertCanCreateStore('merchant')).resolves.toBeUndefined();
    expect(prisma.storeSubscription.findFirst).not.toHaveBeenCalled();
  });

  it('enforces the store snapshot limit for additional stores', async () => {
    prisma.subscriptionSettings.upsert.mockResolvedValue({ enforcementEnabled: true, gracePeriodDays: 0 });
    prisma.store.count.mockResolvedValue(1);
    prisma.storeSubscription.findFirst.mockResolvedValue({ maxStoresSnapshot: 1 });
    await expect(service.assertCanCreateStore('merchant')).rejects.toThrow(ForbiddenException);
  });
});
