CREATE INDEX IF NOT EXISTS "idx_product_name" ON "Product"("name");
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "idx_product_isbulk_stock" ON "Product"("isBulk","stock");

CREATE INDEX IF NOT EXISTS "idx_sale_createdAt" ON "Sale"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_sale_customerId" ON "Sale"("customerId");

CREATE INDEX IF NOT EXISTS "idx_saleitem_saleid" ON "SaleItem"("saleId");

CREATE INDEX IF NOT EXISTS "idx_payment_gateway_status_createdAt" ON "Payment"("gateway","status","createdAt");
CREATE INDEX IF NOT EXISTS "idx_payment_externalId" ON "Payment"("externalId");
CREATE INDEX IF NOT EXISTS "idx_payment_saleId" ON "Payment"("saleId");

CREATE INDEX IF NOT EXISTS "idx_settlementrecord_settlementId" ON "SettlementRecord"("settlementId");
CREATE INDEX IF NOT EXISTS "idx_settlementrecord_externalId_settledAt" ON "SettlementRecord"("externalId","settledAt");
CREATE INDEX IF NOT EXISTS "idx_settlementrecord_matchStatus_settledAt" ON "SettlementRecord"("matchStatus","settledAt");

CREATE INDEX IF NOT EXISTS "idx_inventoryitem_session_product" ON "InventoryItem"("sessionId","productId");
CREATE INDEX IF NOT EXISTS "idx_inventoryitem_session" ON "InventoryItem"("sessionId");

CREATE INDEX IF NOT EXISTS "idx_purchase_supplier_status" ON "Purchase"("supplierId","status");
CREATE INDEX IF NOT EXISTS "idx_purchaseitem_purchase" ON "PurchaseItem"("purchaseId");
CREATE INDEX IF NOT EXISTS "idx_purchaseitem_product" ON "PurchaseItem"("productId");
