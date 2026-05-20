import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const offerUpdateManyMock = jest.fn();
  const couponUpdateManyMock = jest.fn();

  const mockPrisma = {
    offer: {
      updateMany: offerUpdateManyMock,
    },
    coupon: {
      updateMany: couponUpdateManyMock,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
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
});
