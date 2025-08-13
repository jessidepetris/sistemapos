import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { AccountsModule } from './accounts/accounts.module';
import { QuotationsModule } from './quotations/quotations.module';
import { OrdersModule } from './orders/orders.module';
import { CatalogModule } from './catalog/catalog.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { ReportsModule } from './reports/reports.module';
import { ReportsKardexModule } from './reports-kardex/reports-kardex.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PricingModule } from './pricing/pricing.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditModule } from './audit/audit.module';
import { BackupsModule } from './backups/backups.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PromotionsModule } from './promotions/promotions.module';
import { LabelsModule } from './labels/labels.module';
import { ImportsModule } from './imports/imports.module';
import { TicketsModule } from './tickets/tickets.module';
import { DocumentsModule } from './documents/documents.module';
import { KitsModule } from './kits/kits.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { KpisModule } from './kpis/kpis.module';
import { CashRegistersModule } from './cash-registers/cash-registers.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { CashMovementsModule } from './cash-movements/cash-movements.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { PaymentsModule } from './payments/payments.module';
import { InventoryModule } from './inventory/inventory.module';
import { PackVariantsModule } from './pack-variants/pack-variants.module';
import { ScaleModule } from './scale/scale.module';
import { PackagingModule } from './packaging/packaging.module';
import { ScaleFakeModule } from './scale-fake/scale-fake.module';
import { StockGuardModule } from './stock-guard/stock-guard.module';
import { SettlementsModule } from './settlements/settlements.module';
import { BarcodesModule } from './barcodes/barcodes.module';
import { AfipModule } from './afip/afip.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ProductsModule,
    SalesModule,
    AccountsModule,
    QuotationsModule,
    OrdersModule,
    CatalogModule,
    DeliveriesModule,
    ReportsModule,
    ReportsKardexModule,
    SuppliersModule,
    PurchasesModule,
    PricingModule,
    AlertsModule,
    AuditModule,
    BackupsModule,
    InvoicesModule,
    PromotionsModule,
    LabelsModule,
    ImportsModule,
    TicketsModule,
    DocumentsModule,
    KitsModule,
    ReplenishmentModule,
    KpisModule,
    CashRegistersModule,
    CashSessionsModule,
    CashMovementsModule,
    CashRegisterModule,
    PaymentsModule,
    InventoryModule,
    PackVariantsModule,
    ScaleModule,
    PackagingModule,
    ScaleFakeModule,
    StockGuardModule,
    SettlementsModule,
    BarcodesModule,
    AfipModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
