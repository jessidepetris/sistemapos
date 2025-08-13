import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

interface CacheEntry {
  permissions: string[];
  expires: number;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  private cache = new Map<string, CacheEntry>();

  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new ForbiddenException('User not authenticated');

    const permissions = await this.getPermissions(userId);
    req.user.permissions = permissions;

    const missing = required.filter((p) => !permissions.includes(p));
    if (missing.length > 0)
      throw new ForbiddenException('Missing permissions');
    return true;
  }

  private async getPermissions(userId: string): Promise<string[]> {
    const cached = this.cache.get(userId);
    const now = Date.now();
    if (cached && cached.expires > now) return cached.permissions;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    const perms =
      user?.roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permission.name),
      ) || [];
    this.cache.set(userId, {
      permissions: perms,
      expires: now + 5 * 60 * 1000,
    });
    return perms;
  }
}
