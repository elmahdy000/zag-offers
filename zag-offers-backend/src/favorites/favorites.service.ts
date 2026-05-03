import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, offerId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_offerId: { userId, offerId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({
        data: { userId, offerId },
      });
      return { favorited: true };
    }
  }

  async findAllByUser(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { offer: { include: { store: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
