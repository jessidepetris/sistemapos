import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

@Injectable()
export class BackupsService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor(private prisma: PrismaService) {}

  async createBackup(userId?: string, userEmail?: string) {
    const zip = new AdmZip();
    const data: Record<string, any> = {
      products: await this.prisma.product.findMany(),
      clients: await this.prisma.client.findMany(),
      sales: await this.prisma.sale.findMany(),
      saleItems: await this.prisma.saleItem.findMany(),
      purchases: await this.prisma.purchase.findMany(),
      purchaseItems: await this.prisma.purchaseItem.findMany(),
      suppliers: await this.prisma.supplier.findMany(),
      quotations: await this.prisma.quotation.findMany(),
      quotationItems: await this.prisma.quotationItem.findMany(),
      accountMovements: await this.prisma.accountMovement.findMany(),
      auditLogs: await this.prisma.auditLog.findMany(),
      deliveries: await this.prisma.delivery.findMany(),
      orders: await this.prisma.order.findMany(),
      orderItems: await this.prisma.orderItem.findMany(),
      priceChangeLogs: await this.prisma.priceChangeLog.findMany(),
      users: await this.prisma.user.findMany(),
    };

    for (const [key, value] of Object.entries(data)) {
      zip.addFile(`${key}.json`, Buffer.from(JSON.stringify(value, null, 2)));
    }

    await fs.promises.mkdir(this.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.zip`;
    const filepath = path.join(this.backupDir, filename);
    zip.writeZip(filepath);
    const stats = await fs.promises.stat(filepath);

    return this.prisma.backup.create({
      data: {
        filename,
        size: stats.size,
        userId,
        userEmail,
      },
    });
  }

  listBackups() {
    return this.prisma.backup.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getBackup(id: string) {
    const record = await this.prisma.backup.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Backup not found');
    const filepath = path.join(this.backupDir, record.filename);
    return { record, filepath };
  }

  async restoreBackup(
    file: Express.Multer.File,
    userId?: string,
    userEmail?: string,
  ) {
    const zip = new AdmZip(file.buffer);
    const entries = zip.getEntries();
    const data: Record<string, any[]> = {};
    for (const entry of entries) {
      const key = entry.entryName.replace('.json', '');
      data[key] = JSON.parse(entry.getData().toString('utf-8'));
    }

    await this.prisma.$transaction([
      this.prisma.saleItem.deleteMany(),
      this.prisma.sale.deleteMany(),
      this.prisma.purchaseItem.deleteMany(),
      this.prisma.purchase.deleteMany(),
      this.prisma.quotationItem.deleteMany(),
      this.prisma.quotation.deleteMany(),
      this.prisma.orderItem.deleteMany(),
      this.prisma.order.deleteMany(),
      this.prisma.delivery.deleteMany(),
      this.prisma.accountMovement.deleteMany(),
      this.prisma.auditLog.deleteMany(),
      this.prisma.priceChangeLog.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.client.deleteMany(),
      this.prisma.supplier.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);

    if (data.users) await this.prisma.user.createMany({ data: data.users });
    if (data.clients) await this.prisma.client.createMany({ data: data.clients });
    if (data.products) await this.prisma.product.createMany({ data: data.products });
    if (data.suppliers) await this.prisma.supplier.createMany({ data: data.suppliers });
    if (data.priceChangeLogs)
      await this.prisma.priceChangeLog.createMany({ data: data.priceChangeLogs });
    if (data.sales) await this.prisma.sale.createMany({ data: data.sales });
    if (data.saleItems) await this.prisma.saleItem.createMany({ data: data.saleItems });
    if (data.purchases)
      await this.prisma.purchase.createMany({ data: data.purchases });
    if (data.purchaseItems)
      await this.prisma.purchaseItem.createMany({ data: data.purchaseItems });
    if (data.quotations)
      await this.prisma.quotation.createMany({ data: data.quotations });
    if (data.quotationItems)
      await this.prisma.quotationItem.createMany({ data: data.quotationItems });
    if (data.orders) await this.prisma.order.createMany({ data: data.orders });
    if (data.orderItems)
      await this.prisma.orderItem.createMany({ data: data.orderItems });
    if (data.deliveries)
      await this.prisma.delivery.createMany({ data: data.deliveries });
    if (data.accountMovements)
      await this.prisma.accountMovement.createMany({ data: data.accountMovements });
    if (data.auditLogs)
      await this.prisma.auditLog.createMany({ data: data.auditLogs });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || 'unknown',
        userEmail: userEmail || 'unknown',
        action: 'RESTORE_BACKUP',
        entity: 'Backup',
        description: 'Database restored from backup',
      },
    });

    return { restored: true };
  }
}

