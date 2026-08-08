import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as never);
  });

  it('persists role notifications even when Firebase is unavailable', async () => {
    prisma.user.findMany.mockResolvedValueOnce([{ id: 'admin-1' }]);
    prisma.notification.createMany.mockResolvedValue({ count: 1 });

    const result = await service.sendToRole(Role.ADMIN, {
      title: 'Pending store',
      body: 'A store needs review',
      data: { type: 'NEW_PENDING_STORE', storeId: 'store-1' },
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'admin-1',
          type: 'NEW_PENDING_STORE',
        }),
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual({ sent: 0, skipped: 1 });
  });

  it('does not write when the role has no users', async () => {
    prisma.user.findMany.mockResolvedValueOnce([]);

    const result = await service.sendToRole(Role.ADMIN, {
      title: 'System',
      body: 'No recipients',
    });

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 0 });
  });
});
