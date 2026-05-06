import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StoreStatus, OfferStatus } from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma = {
    user: { count: jest.fn() },
    store: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    offer: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    coupon: { count: jest.fn() },
    review: { count: jest.fn() },
    favorite: { count: jest.fn() },
  };

  const mockEvents = {
    broadcast: jest.fn(),
    notifyMerchant: jest.fn(),
    broadcastNewOffer: jest.fn(),
  };

  const mockNotifications = {
    sendToUser: jest.fn(),
    sendToAll: jest.fn(),
    notifyOfferApproved: jest.fn(),
    notifyStoreApproved: jest.fn(),
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEvents },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStats', () => {
    it('should return aggregated counts', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.store.count.mockResolvedValue(5);
      mockPrisma.offer.count.mockResolvedValue(20);
      mockPrisma.coupon.count.mockResolvedValue(100);
      mockPrisma.review.count.mockResolvedValue(50);
      mockPrisma.favorite.count.mockResolvedValue(30);

      const stats = await service.getGlobalStats();

      expect(stats.users.totalUsers).toBe(10);
      expect(stats.stores.totalStores).toBe(5);
      expect(stats.offers.totalOffers).toBe(20);
    });
  });

  describe('approveStore', () => {
    it('should update status and notify', async () => {
      const mockStore = {
        id: 's1',
        status: StoreStatus.PENDING,
        name: 'Store',
        ownerId: 'u1',
        owner: { fcmToken: 'token' },
      };
      mockPrisma.store.findUnique.mockResolvedValue(mockStore);
      mockPrisma.store.update.mockResolvedValue({
        ...mockStore,
        status: StoreStatus.APPROVED,
      });

      await service.approveStore('s1', 'admin-1');

      expect(mockPrisma.store.update).toHaveBeenCalled();
      expect(mockEvents.notifyMerchant).toHaveBeenCalled();
    });
  });

  describe('approveOffer', () => {
    it('should activate and broadcast', async () => {
      const mockOffer = {
        id: 'o1',
        status: OfferStatus.PENDING,
        title: 'Deal',
        store: { name: 'Store', owner: { fcmToken: 'token' } },
      };
      mockPrisma.offer.findUnique.mockResolvedValue(mockOffer);
      mockPrisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: OfferStatus.ACTIVE,
      });

      await service.approveOffer('o1', 'admin-1');

      expect(mockPrisma.offer.update).toHaveBeenCalled();
      expect(mockEvents.broadcastNewOffer).toHaveBeenCalled();
    });
  });
});
