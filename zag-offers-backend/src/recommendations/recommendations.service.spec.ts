import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  const userFindUniqueMock = jest.fn();
  const offerFindManyMock = jest.fn();

  const mockPrisma = {
    user: {
      findUnique: userFindUniqueMock,
    },
    offer: {
      findMany: offerFindManyMock,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendedOffers', () => {
    const userId = 'user-1';

    it('should return empty array if user not found', async () => {
      userFindUniqueMock.mockResolvedValue(null);

      const result = await service.getRecommendedOffers(userId);

      expect(result).toEqual([]);
    });

    it('should recommend based on categories and area', async () => {
      userFindUniqueMock.mockResolvedValue({
        id: userId,
        area: 'El Qawmeya',
        favorites: [
          { offerId: 'o1', offer: { store: { categoryId: 'cat-1' } } },
        ],
      });
      offerFindManyMock.mockResolvedValue([
        { id: 'rec-1', title: 'Recommended' },
      ]);

      const result = await service.getRecommendedOffers(userId);

      expect(offerFindManyMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getTrendingOffers', () => {
    it('should return top offers ordered by coupon count', async () => {
      offerFindManyMock.mockResolvedValue([{ id: 't1', title: 'Trending' }]);

      const result: Array<{ id: string; title: string }> =
        await service.getTrendingOffers();

      expect(offerFindManyMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
