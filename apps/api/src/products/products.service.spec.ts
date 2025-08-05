import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    // mock prisma.product.create
    // @ts-ignore
    prisma.product = { create: jest.fn() };
  });

  it('creates a product', async () => {
    await service.create({
      name: 'Test',
      description: 'desc',
      stock: 1,
      minStock: 1,
      costARS: 1,
      priceARS: 2,
      unit: 'unit',
      category: 'cat',
      barcodes: [],
      isBulk: false,
      isRefrigerated: false,
    } as any);
    expect(prisma.product.create).toHaveBeenCalled();
  });
});
