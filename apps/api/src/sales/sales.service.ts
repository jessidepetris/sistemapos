import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaymentMethod, SaleType } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService, private promotions: PromotionsService) {}

  async create(data: CreateSaleDto) {
    return this.prisma.$transaction(async prisma => {
      const items = data.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
      }));
      const promo = await this.promotions.applyPromotions(items);
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity - (i.discount || 0), 0);
      const discount = data.discount + promo.discount;
      const total = subtotal - discount;
      const sale = await prisma.sale.create({
        data: {
          customerName: data.customerName,
          customerId: data.customerId,
          type: data.type,
          subtotal,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount,
          change: data.change,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
            })),
          },
        },
        include: { items: true },
      });
      if (data.paymentMethod === PaymentMethod.CUENTA_CORRIENTE && data.customerId) {
        await prisma.accountMovement.create({
          data: {
            clientId: data.customerId,
            type: 'CARGO',
            amount: total,
            description: `Venta ${sale.id}`,
            saleId: sale.id,
          },
        });
      }
      return sale;
    });
  }

  findAll(params: { from?: Date; to?: Date; customerId?: number; type?: SaleType }) {
    const { from, to, customerId, type } = params;
    return this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
        customerId,
        type,
      },
      include: { items: true },
    });
  }

  findOne(id: string) {
    return this.prisma.sale.findUnique({ where: { id }, include: { items: true } });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const sale = await this.findOne(id);
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text(`Venta ${sale.id}`);
      doc.text(`Cliente: ${sale.customerName}`);
      doc.text(`Tipo: ${sale.type}`);
      doc.moveDown();
      sale.items.forEach(item => {
        doc.text(`Producto ${item.productId} x${item.quantity} - $${item.price}`);
      });
      doc.moveDown();
      doc.text(`Total: $${sale.total}`);
      doc.end();
    });
  }
}
