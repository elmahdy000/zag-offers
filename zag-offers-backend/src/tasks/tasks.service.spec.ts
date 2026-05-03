import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const offerFindManyMock = jest.fn();
  const offerUpdateManyMock = jest.fn();
  const couponUpdateManyMock = jest.fn();

  const mockPrisma = {
    offer: {
      findMany: offerFindManyMock,
      updateMany: offerUpdateManyMock,
    },
    coupon: {
      updateMany: couponUpdateManyMock,
    },
  };

  const mockNotifications = {
    sendToAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCron', () => {
    it('should expire offers and coupons that have passed their dates', async () => {
      offerUpdateManyMock.mockResolvedValue({ count: 5 });
      couponUpdateManyMock.mockResolvedValue({ count: 10 });

      await service.handleCron();

      expect(offerUpdateManyMock).toHaveBeenCalled();
      expect(couponUpdateManyMock).toHaveBeenCalled();
    });
  });

  describe('sendDailyDigest', () => {
    it('should send notification if unnotified offers exist', async () => {
      const mockOffers = [
        { id: '1', store: { name: 'Store A' } },
        { id: '2', store: { name: 'Store B' } },
      ];
      offerFindManyMock.mockResolvedValue(mockOffers);
      offerUpdateManyMock.mockResolvedValue({ count: 2 });

      await service.sendDailyDigest();

      expect(mockNotifications.sendToAll).toHaveBeenCalledWith(
        expect.stringContaining('2 عروض جديدة'),
        expect.stringContaining('Store A و Store B'),
        expect.any(Object),
      );
      expect(offerUpdateManyMock).toHaveBeenCalled();
    });

    it('should not send notification if no unnotified offers', async () => {
      offerFindManyMock.mockResolvedValue([]);

      await service.sendDailyDigest();

      expect(mockNotifications.sendToAll).not.toHaveBeenCalled();
    });
  });
});
