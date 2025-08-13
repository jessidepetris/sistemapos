import { Test, TestingModule } from '@nestjs/testing';
import { ReplenishmentService } from './replenishment.service';
import { PrismaService } from '../prisma.service';

describe('ReplenishmentService', () => {
  let service: ReplenishmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReplenishmentService, PrismaService],
    }).compile();

    service = module.get<ReplenishmentService>(ReplenishmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
