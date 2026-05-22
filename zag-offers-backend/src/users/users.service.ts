import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { facebookId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async addPoints(userId: string, amount: number, reason: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newPoints = user.points + amount;
    
    let newTier: any = 'BRONZE';
    if (newPoints >= 5000) newTier = 'PLATINUM';
    else if (newPoints >= 2000) newTier = 'GOLD';
    else if (newPoints >= 500) newTier = 'SILVER';

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await (tx as any).pointLog.create({
        data: {
          userId,
          amount,
          reason,
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          points: newPoints,
          tier: newTier,
        },
      });
    });

    return updatedUser;
  }

  async getPointTransactions(userId: string) {
    return (this.prisma as any).pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
