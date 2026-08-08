import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new PermissionsGuard(reflector);

  function context(user: { role: Role; adminPermissions?: string[] }) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => jest.clearAllMocks());

  it('allows administrators regardless of explicit permission list', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users.manage']);
    expect(guard.canActivate(context({ role: Role.ADMIN }))).toBe(true);
  });

  it('allows staff with every required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['stores.view']);
    expect(guard.canActivate(context({ role: Role.STAFF, adminPermissions: ['stores.view'] }))).toBe(true);
  });

  it('denies staff without a required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['stores.manage']);
    expect(guard.canActivate(context({ role: Role.STAFF, adminPermissions: ['stores.view'] }))).toBe(false);
  });

  it('denies non-admin roles on permission-protected routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['dashboard.view']);
    expect(guard.canActivate(context({ role: Role.MERCHANT }))).toBe(false);
  });
});
