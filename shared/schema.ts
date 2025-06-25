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
  // Campo para el porcentaje de descuento que ofrece el proveedor
  discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
  lastPriceUpdate: true,
  discount: true,
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
  sellerId: integer("seller_id").references(() => users.id),
  invoiceType: text("invoice_type").default("remito"), // 'remito' o 'factura_c'
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  province: true,
  notes: true,
  hasAccount: true,
  sellerId: true,
  invoiceType: true,
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  baseUnit: text("base_unit").notNull(),
  barcodes: text("barcodes").array(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  costCurrency: text("cost_currency").notNull().default("ARS"), // Moneda del costo
  stock: numeric("stock", { precision: 10, scale: 2 }).notNull().default("0"),
  reservedStock: numeric("reserved_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  stockAlert: numeric("stock_alert", { precision: 10, scale: 2 }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  // Código de proveedor para facilitar la actualización de precios
  supplierCode: text("supplier_code"),
  isRefrigerated: boolean("is_refrigerated").default(false),
  isBulk: boolean("is_bulk").default(false),
  // Indicar si es un producto compuesto (combo)
  isComposite: boolean("is_composite").default(false),
  // Indicar si el producto está activo (disponible para vender)
  active: boolean("active").default(true),
  // Indicar si el producto es visible en el catálogo web
  webVisible: boolean("web_visible").default(false),
  // Indicar si el producto está discontinuado
  isDiscontinued: boolean("is_discontinued").default(false),
  conversionRates: json("conversion_rates"),
  // Categoría del producto
  category: text("category"),
  // Ruta de la imagen del producto
  imageUrl: text("image_url"),
  // Ubicación del producto en el almacén
  location: text("location"),
  // Valores relacionados con el cálculo de precios
  iva: numeric("iva", { precision: 5, scale: 2 }).default("21"),
  shipping: numeric("shipping", { precision: 5, scale: 2 }).default("0"),
  profit: numeric("profit", { precision: 5, scale: 2 }).default("55"),
  wholesaleProfit: numeric("wholesale_profit", { precision: 5, scale: 2 }).default("35"),
  // Componentes para productos compuestos (almacenados como JSON)
  components: json("components"),
  // Fecha de última actualización del producto
  lastUpdated: timestamp("last_updated").defaultNow(),
  currency: text("currency").default("ARS"), // Moneda del precio de venta (opcional)
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  baseUnit: true,
  barcodes: true,
  price: true,
  wholesalePrice: true,
  cost: true,
  costCurrency: true,
  stock: true,
  stockAlert: true,
  supplierId: true,
  supplierCode: true,
  isRefrigerated: true,
  isBulk: true,
  isComposite: true,
  active: true,
  webVisible: true,
  isDiscontinued: true,
  conversionRates: true,
  category: true,
  imageUrl: true,
  location: true,
  iva: true,
  shipping: true,
  profit: true,
  wholesaleProfit: true,
  components: true,
  currency: true,
});

// Accounts table (for customer current accounts)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  creditLimit: numeric("credit_limit", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  customerId: true,
  balance: true,
  creditLimit: true,
  currency: true,
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  surcharge: numeric("surcharge", { precision: 10, scale: 2 }),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
  surchargePercent: numeric("surcharge_percent", { precision: 5, scale: 2 }),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),  // JSON stringificado con detalles del pago
  documentType: text("document_type").default("remito"),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("completed"),
  notes: text("notes"),
  printOptions: json("print_options"), // Opciones para impresión y envío
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  customerId: true,
  userId: true,
  total: true,
  subtotal: true,
  discount: true,
  surcharge: true,
  discountPercent: true,
  surchargePercent: true,
  paymentMethod: true,
  paymentDetails: true,
  documentType: true,
  invoiceNumber: true,
  status: true,
  notes: true,
  printOptions: true,
  currency: true,
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name"),
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
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  name: true,
  quantity: true,
  unit: true,
  price: true,
  discount: true,
  total: true,
  isConversion: true,
  conversionFactor: true,
  conversionUnit: true,
  conversionBarcode: true,
  currency: true,
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
  isWebOrder: boolean("is_web_order").default(false),
  source: text("source").default("pos"), // Valores posibles: 'pos', 'web', 'phone', etc.
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  userId: true,
  total: true,
  status: true,
  notes: true,
  deliveryDate: true,
  isWebOrder: true,
  source: true,
  currency: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ARS"), // ARS o USD
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  unit: true,
  price: true,
  total: true,
  currency: true,
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
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  customerId: true,
  userId: true,
  type: true,
  relatedSaleId: true,
  amount: true,
  reason: true,
  notes: true,
  currency: true,
});

// Account transactions table
export const accountTransactions = pgTable("account_transactions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ARS"), // ARS o USD
  type: text("type").notNull(), // 'debit', 'credit', 'payment'
  relatedSaleId: integer("related_sale_id").references(() => sales.id),
  relatedNoteId: integer("related_note_id").references(() => notes.id),
  description: text("description").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentMethod: text("payment_method"), // 'cash', 'transfer', 'credit_card', 'debit_card', 'check', 'qr'
});

export const insertAccountTransactionSchema = createInsertSchema(accountTransactions)
  .pick({
    accountId: true,
    amount: true,
    type: true,
    relatedSaleId: true,
    relatedNoteId: true,
    description: true,
    userId: true,
    paymentMethod: true,
    currency: true,
  })
  .extend({
    userId: z.coerce.number().optional(),
    paymentMethod: z.enum(["cash", "transfer", "credit_card", "debit_card", "check", "qr"]).optional(),
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

// Enumeración para los estados de las entregas
export const deliveryStatusEnum = [
  'pending', // Pendiente de asignación
  'assigned', // Asignada a un repartidor
  'in_transit', // En tránsito
  'delivered', // Entregada
  'failed', // Fallida
  'cancelled', // Cancelada
] as const;

// Tabla de vehículos
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'car', 'motorcycle', 'van', etc.
  licensePlate: text("license_plate").notNull().unique(),
  maxCapacity: numeric("max_capacity", { precision: 10, scale: 2 }), // en kg
  refrigerated: boolean("refrigerated").default(false),
  notes: text("notes"),
  active: boolean("active").default(true),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  name: true,
  type: true,
  licensePlate: true,
  maxCapacity: true,
  refrigerated: true,
  notes: true,
  active: true,
});

// Tabla de zonas/rutas de entregas
export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coordinates: json("coordinates"), // Polígono o puntos que definen la zona
  estimatedDeliveryTime: integer("estimated_delivery_time"), // Tiempo estimado en minutos
  deliveryDays: text("delivery_days").array(), // ['monday', 'wednesday', 'friday']
  active: boolean("active").default(true),
});

export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).pick({
  name: true,
  description: true,
  coordinates: true,
  estimatedDeliveryTime: true,
  deliveryDays: true,
  active: true,
});

// Tabla de rutas de entrega
export const deliveryRoutes = pgTable("delivery_routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  zoneId: integer("zone_id").references(() => deliveryZones.id),
  description: text("description"),
  optimizedPath: json("optimized_path"), // Secuencia de puntos optimizada
  estimatedDuration: integer("estimated_duration"), // En minutos
  distance: numeric("distance", { precision: 10, scale: 2 }), // En km
  active: boolean("active").default(true),
});

export const insertDeliveryRouteSchema = createInsertSchema(deliveryRoutes).pick({
  name: true,
  zoneId: true,
  description: true,
  optimizedPath: true,
  estimatedDuration: true,
  distance: true,
  active: true,
});

// Tabla de entregas
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  saleId: integer("sale_id").references(() => sales.id),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id), // Usuario que creó la entrega
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  driverId: integer("driver_id").references(() => users.id), // Conductor/repartidor
  routeId: integer("route_id").references(() => deliveryRoutes.id),
  status: text("status").notNull().$type<typeof deliveryStatusEnum[number]>().default('pending'),
  scheduledDate: timestamp("scheduled_date").notNull(),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryNotes: text("delivery_notes"),
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  trackingCode: text("tracking_code"), // Código único para seguimiento
  priority: integer("priority").default(0), // Prioridad de la entrega (0-10)
  requiresRefrigeration: boolean("requires_refrigeration").default(false),
  proof: text("proof"), // URL a la imagen de prueba de entrega
  deliveryPosition: json("delivery_position"), // Posición actual {lat, lng}
  requestSignature: boolean("request_signature").default(false),
  signatureUrl: text("signature_url"), // URL a la imagen de la firma
  totalWeight: numeric("total_weight", { precision: 10, scale: 2 }), // Peso total en kg
  currency: text("currency").notNull().default("ARS"), // ARS o USD
});

export const insertDeliverySchema = createInsertSchema(deliveries).pick({
  orderId: true,
  saleId: true,
  customerId: true,
  userId: true,
  vehicleId: true,
  driverId: true,
  routeId: true,
  status: true,
  scheduledDate: true,
  estimatedDeliveryTime: true,
  deliveryAddress: true,
  deliveryNotes: true,
  recipientName: true,
  recipientPhone: true,
  priority: true,
  requiresRefrigeration: true,
  requestSignature: true,
  totalWeight: true,
  currency: true,
});

// Tabla para el registro de eventos de entregas
export const deliveryEvents = pgTable("delivery_events", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").notNull().references(() => deliveries.id),
  timestamp: timestamp("timestamp").defaultNow(),
  eventType: text("event_type").notNull(), // 'status_change', 'location_update', 'note', 'issue'
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id), // Usuario que registró el evento
  location: json("location"), // {lat, lng}
  metadata: json("metadata"), // Datos adicionales
});

export const insertDeliveryEventSchema = createInsertSchema(deliveryEvents).pick({
  deliveryId: true,
  eventType: true,
  description: true,
  userId: true,
  location: true,
  metadata: true,
});

// Tabla para asignación de rutas diarias
export const routeAssignments = pgTable("route_assignments", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  routeId: integer("route_id").notNull().references(() => deliveryRoutes.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  notes: text("notes"),
});

export const insertRouteAssignmentSchema = createInsertSchema(routeAssignments).pick({
  date: true,
  routeId: true,
  driverId: true,
  vehicleId: true,
  status: true,
  startTime: true,
  endTime: true,
  notes: true,
});

// Type exports para los modelos de logística
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;

export type DeliveryRoute = typeof deliveryRoutes.$inferSelect;
export type InsertDeliveryRoute = z.infer<typeof insertDeliveryRouteSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type InsertDeliveryEvent = z.infer<typeof insertDeliveryEventSchema>;

export type RouteAssignment = typeof routeAssignments.$inferSelect;
export type InsertRouteAssignment = z.infer<typeof insertRouteAssignmentSchema>;

// Catálogo Web - Usuarios web para clientes
export const webUsers = pgTable("web_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  verificationToken: text("verification_token"),
  verified: boolean("verified").default(false),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

export const insertWebUserSchema = createInsertSchema(webUsers).pick({
  email: true,
  password: true,
  customerId: true,
  verificationToken: true,
  verified: true,
});

// Catálogo Web - Configuraciones del catálogo
export const catalogSettings = pgTable("catalog_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Punto Pastelero"),
  storeDescription: text("store_description"),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3498db"),
  secondaryColor: text("secondary_color").default("#2ecc71"),
  featuredProducts: integer("featured_products").array(),
  showOutOfStock: boolean("show_out_of_stock").default(true),
  orderMinimum: numeric("order_minimum", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  deliveryMinimumForFree: numeric("delivery_minimum_for_free", { precision: 10, scale: 2 }),
  openingHours: json("opening_hours"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  termsAndConditions: text("terms_and_conditions"),
  privacyPolicy: text("privacy_policy"),
  socialLinks: json("social_links"),
  active: boolean("active").default(true),
});

export const insertCatalogSettingsSchema = createInsertSchema(catalogSettings).pick({
  storeName: true,
  storeDescription: true,
  logo: true,
  primaryColor: true,
  secondaryColor: true,
  featuredProducts: true,
  showOutOfStock: true,
  orderMinimum: true,
  deliveryFee: true,
  deliveryMinimumForFree: true,
  openingHours: true,
  contactEmail: true,
  contactPhone: true,
  termsAndConditions: true,
  privacyPolicy: true,
  socialLinks: true,
  active: true,
});

// Catálogo Web - Categorías del catálogo (para organizar productos en el catálogo)
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: integer("parent_id"), // Referencia simple sin restricción de clave foránea
  displayOrder: integer("display_order").default(0),
  active: boolean("active").default(true),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  description: true,
  imageUrl: true,
  parentId: true,
  displayOrder: true,
  active: true,
  slug: true,
  metaTitle: true,
  metaDescription: true,
}).extend({
  slug: z.string().min(1, "El slug es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.number().optional(),
  displayOrder: z.number().optional(),
  active: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});

// Relación entre productos y categorías (muchos a muchos)
export const productCategoryRelations = pgTable("product_category_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Índice único para evitar duplicados
  unq: uniqueIndex().on(table.productId, table.categoryId),
}));

export const insertProductCategoryRelationSchema = createInsertSchema(productCategoryRelations).pick({
  productId: true,
  categoryId: true,
  isPrimary: true,
});

// Catálogo Web - Carritos de compra
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  webUserId: integer("web_user_id").references(() => webUsers.id),
  sessionId: text("session_id"), // Para usuarios no autenticados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").default("active"), // active, abandoned, converted
  totalItems: integer("total_items").default(0),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0"),
});

export const insertCartSchema = createInsertSchema(carts).pick({
  webUserId: true,
  sessionId: true,
  status: true,
});

// Catálogo Web - Items del carrito
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notes: text("notes"),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
  unit: true,
  price: true,
  notes: true,
});

// Catálogo Web - Revisiones y calificaciones de productos
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  webUserId: integer("web_user_id").notNull().references(() => webUsers.id),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("pending"), // pending, approved, rejected
});

export const insertProductReviewSchema = createInsertSchema(productReviews).pick({
  productId: true,
  webUserId: true,
  rating: true,
  title: true,
  review: true,
});

// Agregar propiedad isWebOrder a la tabla de orders existente
export const webOrders = pgTable("web_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  webUserId: integer("web_user_id").notNull().references(() => webUsers.id),
  cartId: integer("cart_id").references(() => carts.id),
  checkoutEmail: text("checkout_email"),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  trackingCode: text("tracking_code"),
  notes: text("notes"),
});

export const insertWebOrderSchema = createInsertSchema(webOrders).pick({
  orderId: true,
  webUserId: true,
  cartId: true,
  checkoutEmail: true,
  shippingAddress: true, 
  billingAddress: true,
  paymentMethod: true,
  paymentStatus: true,
  trackingCode: true,
  notes: true,
});

// Type exports para el catálogo web
export type WebUser = typeof webUsers.$inferSelect;
export type InsertWebUser = z.infer<typeof insertWebUserSchema>;

export type CatalogSettings = typeof catalogSettings.$inferSelect;
export type InsertCatalogSettings = z.infer<typeof insertCatalogSettingsSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type ProductCategoryRelation = typeof productCategoryRelations.$inferSelect;
export type InsertProductCategoryRelation = z.infer<typeof insertProductCategoryRelationSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

export type WebOrder = typeof webOrders.$inferSelect;
export type InsertWebOrder = z.infer<typeof insertWebOrderSchema>;

// Purchases table
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),  // JSON stringificado con detalles del pago
  documentType: text("document_type").default("remito"),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("completed"),
  notes: text("notes"),
});

// Purchase items table
export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  // Campos para tracking de conversiones
  isConversion: boolean("is_conversion").default(false),
  conversionFactor: numeric("conversion_factor", { precision: 10, scale: 3 }).default("1"),
  conversionUnit: text("conversion_unit"),
  conversionBarcode: text("conversion_barcode"),
});

// Bank accounts table
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull(), // 'savings', 'current'
  alias: text("alias").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).pick({
  bankName: true,
  accountNumber: true,
  accountType: true,
  alias: true,
  isActive: true,
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

// Quotations table
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => customers.id),
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  dateValidUntil: timestamp("date_valid_until").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const insertQuotationSchema = createInsertSchema(quotations).pick({
  clientId: true,
  dateValidUntil: true,
  status: true,
  totalAmount: true,
  notes: true,
  createdBy: true,
});

// Quotation items table
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).pick({
  quotationId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
});

// Types
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
