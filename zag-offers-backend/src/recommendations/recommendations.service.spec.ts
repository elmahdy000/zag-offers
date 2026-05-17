import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  const userFindUniqueMock = jest.fn();
  const offerFindManyMock = jest.fn();
  const analyticsEventGroupByMock = jest.fn();
  const getUserInterestsMock = jest.fn();

  const mockPrisma = {
    user: {
      findUnique: userFindUniqueMock,
    },
    offer: {
      findMany: offerFindManyMock,
    },
    analyticsEvent: {
      groupBy: analyticsEventGroupByMock,
    },
  };

  const mockAnalytics = {
    getUserInterests: getUserInterestsMock,
    trackEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsService, useValue: mockAnalytics },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            clear: jest.fn(),
          },
        },
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
      analyticsEventGroupByMock.mockResolvedValue([]);
      offerFindManyMock.mockResolvedValue([]);

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
      getUserInterestsMock.mockResolvedValue({
        categoryWeights: { 'cat-1': 5 },
        areaWeights: { 'El Qawmeya': 3 },
      });
      offerFindManyMock.mockResolvedValue([
        {
          id: 'rec-1',
          title: 'Recommended',
          isFeatured: false,
          createdAt: new Date(),
          store: { categoryId: 'cat-1', area: 'El Qawmeya' },
        },
      ]);

      const result = await service.getRecommendedOffers(userId);

      expect(offerFindManyMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getTrendingOffers', () => {
    it('should return top offers ordered by coupon count', async () => {
      analyticsEventGroupByMock.mockResolvedValue([]);
      offerFindManyMock.mockResolvedValue([{ id: 't1', title: 'Trending' }]);

      const result: Array<{ id: string; title: string }> =
        await service.getTrendingOffers();

      expect(offerFindManyMock).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
