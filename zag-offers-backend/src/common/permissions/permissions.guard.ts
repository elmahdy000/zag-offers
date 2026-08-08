import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { AdminPermission } from './admin-permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<{
      user?: { role: Role; adminPermissions?: string[] };
    }>().user;
    if (user?.role === Role.ADMIN) return true;
    if (user?.role !== Role.STAFF) return false;
    const granted = new Set(user.adminPermissions ?? []);
    return required.every((permission) => granted.has(permission));
  }
}
