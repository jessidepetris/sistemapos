import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService, PrismaService],
    }).compile();
    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
    // mock prisma methods
    // @ts-ignore
    prisma.product = { findMany: vi.fn().mockResolvedValue([]) } as any;
    prisma.client = { findMany: vi.fn().mockResolvedValue([]) } as any;
    prisma.priceChangeLog = { findMany: vi.fn().mockResolvedValue([]) } as any;
    prisma.order = { findMany: vi.fn().mockResolvedValue([]) } as any;
    prisma.purchase = { findMany: vi.fn().mockResolvedValue([]) } as any;
  });

  it('returns alerts', async () => {
    const alerts = await service.getAlerts();
    expect(alerts).toEqual([]);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});

