import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("employee"),
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  // Campo para la fecha de última actualización de precios
  lastPriceUpdate: timestamp("last_price_update"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
  lastPriceUpdate: true,
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  province: text("province"),
  city: text("city"),
  notes: text("notes"),
  hasAccount: boolean("has_account").default(false),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
  hasAccount: true,
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  baseUnit: text("base_unit").notNull(),
  barcodes: text("barcodes").array(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  stock: numeric("stock", { precision: 10, scale: 2 }).notNull().default("0"),
  stockAlert: numeric("stock_alert", { precision: 10, scale: 2 }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  // Código de proveedor para facilitar la actualización de precios
  supplierCode: text("supplier_code"),
  isRefrigerated: boolean("is_refrigerated").default(false),
  isBulk: boolean("is_bulk").default(false),
  // Indicar si es un producto compuesto (combo)
  isComposite: boolean("is_composite").default(false),
  conversionRates: json("conversion_rates"),
  // Categoría del producto
  category: text("category"),
  // Ruta de la imagen del producto
  imageUrl: text("image_url"),
  // Valores relacionados con el cálculo de precios
  iva: numeric("iva", { precision: 5, scale: 2 }).default("21"),
  shipping: numeric("shipping", { precision: 5, scale: 2 }).default("0"),
  profit: numeric("profit", { precision: 5, scale: 2 }).default("30"),
  // Componentes para productos compuestos (almacenados como JSON)
  components: json("components"),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  baseUnit: true,
  barcodes: true,
  price: true,
  cost: true,
  stock: true,
  stockAlert: true,
  supplierId: true,
  supplierCode: true,
  isRefrigerated: true,
  isBulk: true,
  isComposite: true,
  conversionRates: true,
  category: true,
  imageUrl: true,
  iva: true,
  shipping: true,
  profit: true,
  components: true,
});

// Accounts table (for customer current accounts)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  creditLimit: numeric("credit_limit", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  customerId: true,
  balance: true,
  creditLimit: true,
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),  // JSON stringificado con detalles del pago
  documentType: text("document_type").default("remito"),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("completed"),
  notes: text("notes"),
  printOptions: json("print_options"), // Opciones para impresión y envío
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  customerId: true,
  userId: true,
  total: true,
  paymentMethod: true,
  paymentDetails: true,
  documentType: true,
  invoiceNumber: true,
  status: true,
  notes: true,
  printOptions: true,
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  // Campos para tracking de conversiones
  isConversion: boolean("is_conversion").default(false),
  conversionFactor: numeric("conversion_factor", { precision: 10, scale: 3 }).default("1"),
  conversionUnit: text("conversion_unit"),
  conversionBarcode: text("conversion_barcode"),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  unit: true,
  price: true,
  discount: true,
  total: true,
  isConversion: true,
  conversionFactor: true,
  conversionUnit: true,
  conversionBarcode: true,
});

// Orders table (for customer orders)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  deliveryDate: timestamp("delivery_date"),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  userId: true,
  total: true,
  status: true,
  notes: true,
  deliveryDate: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  unit: true,
  price: true,
  total: true,
});

// Credit/Debit Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'credit' or 'debit'
  relatedSaleId: integer("related_sale_id").references(() => sales.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  customerId: true,
  userId: true,
  type: true,
  relatedSaleId: true,
  amount: true,
  reason: true,
  notes: true,
});

// Account transactions table
export const accountTransactions = pgTable("account_transactions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'debit', 'credit', 'payment'
  relatedSaleId: integer("related_sale_id").references(() => sales.id),
  relatedNoteId: integer("related_note_id").references(() => notes.id),
  description: text("description").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const insertAccountTransactionSchema = createInsertSchema(accountTransactions).pick({
  accountId: true,
  amount: true,
  type: true,
  relatedSaleId: true,
  relatedNoteId: true,
  description: true,
  userId: true,
});

// Tabla para los componentes de productos compuestos (combos)
export const productComponents = pgTable("product_components", {
  id: serial("id").primaryKey(),
  compositeProductId: integer("composite_product_id").notNull().references(() => products.id),
  componentProductId: integer("component_product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
});

export const insertProductComponentSchema = createInsertSchema(productComponents).pick({
  compositeProductId: true,
  componentProductId: true,
  quantity: true,
  unit: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type AccountTransaction = typeof accountTransactions.$inferSelect;
export type InsertAccountTransaction = z.infer<typeof insertAccountTransactionSchema>;
