import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../prisma.service';

@Controller()
export class HealthController {
  constructor(private health: HealthCheckService, private prisma: PrismaService) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      async () => ({
        memory_heap: { status: 'up', heap: process.memoryUsage().heapUsed },
      }),
      async () => ({
        uptime: { status: 'up', uptime: process.uptime() },
      }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' } };
        } catch (e) {
          throw new HealthCheckError('database', e as any);
        }
      },
    ]);
  }
}
