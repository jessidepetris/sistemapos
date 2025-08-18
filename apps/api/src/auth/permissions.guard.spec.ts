import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
  } as any;
  const guard = new PermissionsGuard(reflector, prisma);

  const context: any = {
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'user1' } }) }),
    getHandler: () => null,
  };

  it('allows when user has permission', async () => {
    reflector.get = vi.fn().mockReturnValue(['canCloseCash']);
    prisma.user.findUnique.mockResolvedValue({
      roles: [
        {
          role: {
            permissions: [{ permission: { name: 'canCloseCash' } }],
          },
        },
      ],
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws when missing permission', async () => {
    reflector.get = vi.fn().mockReturnValue(['canCloseCash']);
    prisma.user.findUnique.mockResolvedValue({ roles: [] });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
