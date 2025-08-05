import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { AccountsModule } from './accounts/accounts.module';
import { QuotationsModule } from './quotations/quotations.module';
import { OrdersModule } from './orders/orders.module';
import { CatalogModule } from './catalog/catalog.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { ReportsModule } from './reports/reports.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PricingModule } from './pricing/pricing.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditModule } from './audit/audit.module';
import { BackupsModule } from './backups/backups.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PromotionsModule } from './promotions/promotions.module';
import { LabelsModule } from './labels/labels.module';

@Module({
  imports: [
    ProductsModule,
    SalesModule,
    AccountsModule,
    QuotationsModule,
    OrdersModule,
    CatalogModule,
    DeliveriesModule,
    ReportsModule,
    SuppliersModule,
    PurchasesModule,
    PricingModule,
    AlertsModule,
    AuditModule,
    BackupsModule,
    InvoicesModule,
    PromotionsModule,
    LabelsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
