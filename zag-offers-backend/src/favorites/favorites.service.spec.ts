import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockPrisma = {
    favorite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggle', () => {
    const userId = 'user-1';
    const offerId = 'offer-1';

    it('should create a favorite if it does not exist', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.toggle(userId, offerId);

      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
        data: { userId, offerId },
      });
      expect(result.favorited).toBe(true);
    });

    it('should delete a favorite if it already exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });

      const result = await service.toggle(userId, offerId);

      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
        where: { id: 'fav-1' },
      });
      expect(result.favorited).toBe(false);
    });
  });

  describe('findAllByUser', () => {
    it('should return a list of favorites with offer details', async () => {
      const mockFavs = [
        { id: '1', offer: { title: 'Offer 1', store: { name: 'Store 1' } } },
      ];
      mockPrisma.favorite.findMany.mockResolvedValue(mockFavs);

      const result = await service.findAllByUser('user-1');

      expect(mockPrisma.favorite.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockFavs);
    });
  });
});
