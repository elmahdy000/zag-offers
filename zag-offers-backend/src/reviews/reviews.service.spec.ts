import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrisma = {
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEvents = {
    notifyMerchant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: Prisma.ReviewCreateInput = {
      rating: 5,
      comment: 'Excellent!',
      store: { connect: { id: 'store-1' } },
      customer: { connect: { id: 'user-1' } },
    };

    it('should throw BadRequestException if rating is less than 1', async () => {
      await expect(service.create({ ...createDto, rating: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if rating is more than 5', async () => {
      await expect(service.create({ ...createDto, rating: 6 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if customer already reviewed this store', async () => {
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'existing-review' });

      await expect(service.create(createDto)).rejects.toThrow(
        'قمت بتقييم هذا المحل من قبل',
      );
    });

    it('should create review and notify merchant', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue({
        id: 'new-review',
        rating: 5,
        storeId: 'store-1',
        comment: 'Excellent!',
        store: { ownerId: 'merchant-1' },
        customer: { name: 'Customer' },
      });

      const result = await service.create(createDto);

      expect(mockPrisma.review.create).toHaveBeenCalled();
      expect(mockEvents.notifyMerchant).toHaveBeenCalledWith(
        'merchant-1',
        expect.any(Object),
      );
      expect(result.id).toBe('new-review');
    });
  });

  describe('remove', () => {
    it('should throw if review does not exist', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(service.remove('id', 'user-1')).rejects.toThrow(
        'Review not found',
      );
    });

    it('should throw if user is not the owner', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        customerId: 'other-user',
      });

      await expect(service.remove('id', 'user-1')).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should delete review if user is the owner', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ customerId: 'user-1' });

      await service.remove('id', 'user-1');

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      });
    });
  });
});
