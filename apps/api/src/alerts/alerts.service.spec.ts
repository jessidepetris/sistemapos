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
    prisma.product = { findMany: jest.fn().mockResolvedValue([]) };
    // @ts-ignore
    prisma.client = { findMany: jest.fn().mockResolvedValue([]) };
    // @ts-ignore
    prisma.priceChangeLog = { findMany: jest.fn().mockResolvedValue([]) };
    // @ts-ignore
    prisma.order = { findMany: jest.fn().mockResolvedValue([]) };
    // @ts-ignore
    prisma.purchase = { findMany: jest.fn().mockResolvedValue([]) };
  });

  it('returns alerts', async () => {
    const alerts = await service.getAlerts();
    expect(alerts).toEqual([]);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});

