import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { subDays } from 'date-fns';

type AlertType = 'stock_bajo' | 'cuenta_vencida' | 'precio_subido' | 'pedido_pendiente' | 'compra_impaga';
type Severity = 'info' | 'warning' | 'critical';

export interface Alert {
  type: AlertType;
  title: string;
  description: string;
  severity: Severity;
  relatedId: string | null;
}

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const products = await this.prisma.product.findMany();
    products
      .filter(p => Number(p.stock) <= Number(p.minStock ?? 0))
      .forEach(p => {
        alerts.push({
          type: 'stock_bajo',
          title: `Stock bajo: ${p.name}`,
          description: `Stock actual ${p.stock} - mínimo ${p.minStock}`,
          severity: 'warning',
          relatedId: String(p.id),
        });
      });

    const clients = await this.prisma.client.findMany({ include: { accountMovements: true } });
    const now = new Date();
    clients.forEach(c => {
      const balance = c.accountMovements.reduce((sum, m) => sum + (m.type === 'CARGO' ? Number(m.amount) : -Number(m.amount)), 0);
      if (balance > 0) {
        const lastPayment = c.accountMovements
          .filter(m => m.type === 'PAGO')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        const lastDate = lastPayment?.createdAt ?? c.accountMovements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt;
        if (lastDate && now.getTime() - lastDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
          alerts.push({
            type: 'cuenta_vencida',
            title: `Cuenta vencida: ${c.name}`,
            description: `Saldo pendiente $${balance}`,
            severity: 'critical',
            relatedId: String(c.id),
          });
        }
      }
    });

    const since = subDays(new Date(), 7);
    const priceLogs = await this.prisma.priceChangeLog.findMany({
      where: { createdAt: { gte: since } },
      include: { product: true },
    });
    priceLogs.forEach(log => {
      const oldPrice = Number(log.oldPrice);
      const newPrice = Number(log.newPrice);
      if (oldPrice > 0 && (newPrice - oldPrice) / oldPrice > 0.1) {
        alerts.push({
          type: 'precio_subido',
          title: `Precio subido: ${log.product.name}`,
          description: `$${oldPrice} → $${newPrice}`,
          severity: 'info',
          relatedId: String(log.productId),
        });
      }
    });

    const orders = await this.prisma.order.findMany({
      where: { status: { in: ['PENDIENTE', 'EN_CAMINO'] } },
    });
    orders.forEach(o => {
      alerts.push({
        type: 'pedido_pendiente',
        title: `Pedido ${o.id} ${o.status.toLowerCase()}`,
        description: `Total $${o.total}`,
        severity: 'info',
        relatedId: o.id,
      });
    });

    const purchases = await this.prisma.purchase.findMany();
    purchases
      .filter(p => Number(p.paidAmount) < Number(p.total))
      .forEach(p => {
        alerts.push({
          type: 'compra_impaga',
          title: `Compra impaga ${p.id}`,
          description: `Pagado $${p.paidAmount} de $${p.total}`,
          severity: 'warning',
          relatedId: p.id,
        });
      });

    return alerts;
  }
}

