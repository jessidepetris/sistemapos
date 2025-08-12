import { Test, TestingModule } from '@nestjs/testing';
import { ImportsService } from './imports.service';
import { PrismaService } from '../prisma.service';

describe('ImportsService', () => {
  let service: ImportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportsService, PrismaService],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
