import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    adminId: string;
    details?: string;
    targetId?: string;
    targetName?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: params.action,
        adminId: params.adminId,
        details: params.details,
        targetId: params.targetId,
        targetName: params.targetName,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    const { page = 1, limit = 20, adminId, action } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.max(1, Math.ceil(total / limit)),
        limit,
      },
    };
  }
}
