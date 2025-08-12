import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsKardexService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    productId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { productId, type, from, to } = query;
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.pageSize || 50), 5000);
    const where: any = {};
    if (productId) where.productId = Number(productId);
    if (type && type !== 'ALL') where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const [rows, count, sumIn, sumOut] = await this.prisma.$transaction([
      this.prisma.costLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { product: true },
      }),
      this.prisma.costLedger.count({ where }),
      this.prisma.costLedger.aggregate({
        where: { ...where, qty: { gt: 0 } },
        _sum: { qty: true, totalCostArs: true },
      }),
      this.prisma.costLedger.aggregate({
        where: { ...where, qty: { lt: 0 } },
        _sum: { qty: true, totalCostArs: true },
      }),
    ]);
    const totals = {
      qtyIn: Number(sumIn._sum.qty || 0),
      qtyOut: Math.abs(Number(sumOut._sum.qty || 0)),
      costIn: Number(sumIn._sum.totalCostArs || 0),
      costOut: Math.abs(Number(sumOut._sum.totalCostArs || 0)),
    };
    return {
      rows: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        productId: r.productId,
        productName: r.product.name,
        type: r.type,
        qty: r.qty,
        unitCostArs: r.unitCostArs,
        totalCostArs: r.totalCostArs,
        refTable: r.refTable,
        refId: r.refId,
        notes: r.notes,
      })),
      totals,
      page,
      pageSize,
      count,
    };
  }
}
