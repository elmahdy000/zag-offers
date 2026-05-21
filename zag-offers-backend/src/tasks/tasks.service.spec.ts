import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TasksService', () => {
  let service: TasksService;

  const offerFindManyMock = jest.fn();
  const offerUpdateManyMock = jest.fn();
  const couponUpdateManyMock = jest.fn();
  const sendToUserIdMock = jest.fn();

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
    sendToUserId: sendToUserIdMock,
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
      offerFindManyMock.mockResolvedValue([
        { id: '1', title: 'Offer 1', store: { ownerId: 'user1', name: 'Store 1' } }
      ]);
      offerUpdateManyMock.mockResolvedValue({ count: 1 });
      couponUpdateManyMock.mockResolvedValue({ count: 10 });
      sendToUserIdMock.mockResolvedValue({});

      await service.handleCron();

      expect(offerFindManyMock).toHaveBeenCalled();
      expect(offerUpdateManyMock).toHaveBeenCalled();
      expect(couponUpdateManyMock).toHaveBeenCalled();
      expect(sendToUserIdMock).toHaveBeenCalledWith('user1', expect.any(Object));
    });
  });
});
