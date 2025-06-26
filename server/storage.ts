import { users, User, InsertUser, Supplier, InsertSupplier, Customer, InsertCustomer, 
  Product, InsertProduct, Account, InsertAccount, Sale, InsertSale, SaleItem, InsertSaleItem, 
  Order, InsertOrder, OrderItem, InsertOrderItem, Note, InsertNote, AccountTransaction, InsertAccountTransaction, 
  Vehicle, InsertVehicle, DeliveryZone, InsertDeliveryZone, DeliveryRoute, InsertDeliveryRoute, 
  Delivery, InsertDelivery, DeliveryEvent, InsertDeliveryEvent, RouteAssignment, InsertRouteAssignment, 
  Cart, InsertCart, CartItem, InsertCartItem, WebUser, InsertWebUser,
  ProductCategory, InsertProductCategory, ProductCategoryRelation, InsertProductCategoryRelation,
  BankAccount, InsertBankAccount } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Purchase, PurchaseItem, InsertPurchase, UpdatePurchase, InsertPurchaseItem } from "../shared/types";

const MemoryStore = createMemoryStore(session);

type StoragePurchase = Omit<Purchase, 'items'>;

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Web Cart
  getCart(id: number): Promise<Cart | undefined>;
  getCartsBySessionId(sessionId: string): Promise<Cart[]>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCart(id: number, cart: Partial<Cart>): Promise<Cart>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  getCartItemsByCartId(cartId: number): Promise<CartItem[]>;
  createCartItem(item: InsertCartItem): Promise<CartItem>;
  deleteCartItem(id: number): Promise<void>;
  
  // Suppliers
  getSupplier(id: number): Promise<Supplier | undefined>;
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Accounts
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByCustomerId(customerId: number): Promise<Account | undefined>;
  getAllAccounts(): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<Account>): Promise<Account>;
  deleteAccount(id: number): Promise<void>;
  
  // Account Transactions
  getAccountTransaction(id: number): Promise<AccountTransaction | undefined>;
  getAccountTransactions(accountId: number): Promise<AccountTransaction[]>;
  createAccountTransaction(transaction: any): Promise<AccountTransaction>;
  
  // Sales
  getSale(id: number): Promise<Sale | undefined>;
  getAllSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<Sale>): Promise<Sale>;
  deleteSale(id: number): Promise<void>;
  
  // Sale Items
  getSaleItem(id: number): Promise<SaleItem | undefined>;
  getSaleItemsBySaleId(saleId: number): Promise<SaleItem[]>;
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;
  
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  
  // Order Items
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  deleteOrderItems(orderId: number): Promise<void>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // Notes (Credit/Debit)
  getNote(id: number): Promise<Note | undefined>;
  getAllNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;
  
  // Vehicles
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getAllVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;
  
  // Delivery Zones
  getDeliveryZone(id: number): Promise<DeliveryZone | undefined>;
  getAllDeliveryZones(): Promise<DeliveryZone[]>;
  createDeliveryZone(zone: InsertDeliveryZone): Promise<DeliveryZone>;
  updateDeliveryZone(id: number, zone: Partial<DeliveryZone>): Promise<DeliveryZone>;
  deleteDeliveryZone(id: number): Promise<void>;
  
  // Delivery Routes
  getDeliveryRoute(id: number): Promise<DeliveryRoute | undefined>;
  getAllDeliveryRoutes(): Promise<DeliveryRoute[]>;
  getDeliveryRoutesByZone(zoneId: number): Promise<DeliveryRoute[]>;
  createDeliveryRoute(route: InsertDeliveryRoute): Promise<DeliveryRoute>;
  updateDeliveryRoute(id: number, route: Partial<DeliveryRoute>): Promise<DeliveryRoute>;
  deleteDeliveryRoute(id: number): Promise<void>;
  
  // Deliveries
  getDelivery(id: number): Promise<Delivery | undefined>;
  getAllDeliveries(): Promise<Delivery[]>;
  getDeliveriesByStatus(status: string): Promise<Delivery[]>;
  getDeliveriesByDriver(driverId: number): Promise<Delivery[]>;
  getDeliveriesByCustomer(customerId: number): Promise<Delivery[]>;
  getDeliveriesByDate(date: Date): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<Delivery>): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string, userId: number): Promise<Delivery>;
  deleteDelivery(id: number): Promise<void>;
  
  // Delivery Events
  getDeliveryEvent(id: number): Promise<DeliveryEvent | undefined>;
  getDeliveryEventsByDelivery(deliveryId: number): Promise<DeliveryEvent[]>;
  createDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent>;
  
  // Route Assignments
  getRouteAssignment(id: number): Promise<RouteAssignment | undefined>;
  getRouteAssignmentsByDate(date: Date): Promise<RouteAssignment[]>;
  getRouteAssignmentsByDriver(driverId: number): Promise<RouteAssignment[]>;
  createRouteAssignment(assignment: InsertRouteAssignment): Promise<RouteAssignment>;
  updateRouteAssignment(id: number, assignment: Partial<RouteAssignment>): Promise<RouteAssignment>;
  deleteRouteAssignment(id: number): Promise<void>;
  
  // Product Categories
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  getAllProductCategories(): Promise<ProductCategory[]>;
  getProductCategoriesByParentId(parentId: number | null): Promise<ProductCategory[]>;
  getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<ProductCategory>): Promise<ProductCategory>;
  deleteProductCategory(id: number): Promise<void>;
  
  // Product Category Relations
  getProductCategoriesByProductId(productId: number): Promise<ProductCategory[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  addProductToCategory(productId: number, categoryId: number): Promise<ProductCategoryRelation>;
  removeProductFromCategory(productId: number, categoryId: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;

  // Bank Accounts
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  getAllBankAccounts(): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: number): Promise<void>;

  // Payments
  createPayment(payment: any): Promise<any>;

  // Budgets
  getBudget(id: number): Promise<import("../shared/types").Budget | undefined>;
  getAllBudgets(): Promise<import("../shared/types").Budget[]>;
  createBudget(insertBudget: import("../shared/types").InsertBudget): Promise<import("../shared/types").Budget>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suppliers: Map<number, Supplier>;
  private customers: Map<number, Customer>;
  private products: Map<number, Product>;
  private accounts: Map<number, Account>;
  private accountTransactions: Map<number, AccountTransaction>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private notes: Map<number, Note>;
  
  // Logistics related maps
  private vehicles: Map<number, Vehicle>;
  private deliveryZones: Map<number, DeliveryZone>;
  private deliveryRoutes: Map<number, DeliveryRoute>;
  private deliveries: Map<number, Delivery>;
  private deliveryEvents: Map<number, DeliveryEvent>;
  private routeAssignments: Map<number, RouteAssignment>;
  
  // ID counters
  private userIdCounter: number;
  private supplierIdCounter: number;
  private customerIdCounter: number;
  private productIdCounter: number;
  private accountIdCounter: number;
  private accountTransactionIdCounter: number;
  private saleIdCounter: number;
  private saleItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private noteIdCounter: number;
  
  // Logistics ID counters
  private vehicleIdCounter: number;
  private deliveryZoneIdCounter: number;
  private deliveryRouteIdCounter: number;
  private deliveryIdCounter: number;
  private deliveryEventIdCounter: number;
  private routeAssignmentIdCounter: number;
  
  // Web maps
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private webUsers: Map<number, WebUser>;
  
  // Category maps
  private productCategories: Map<number, ProductCategory>;
  private productCategoryRelations: Map<number, ProductCategoryRelation>;
  
  // Web counters
  private cartIdCounter: number;
  private cartItemIdCounter: number;
  private webUserIdCounter: number;
  
  // Category counters
  private productCategoryIdCounter: number;
  private productCategoryRelationIdCounter: number;
  
  // Purchase maps
  private purchases: Map<number, StoragePurchase> = new Map();
  private purchaseItems: Map<number, PurchaseItem> = new Map();
  private purchaseIdCounter = 1;
  private purchaseItemIdCounter = 1;
  
  // Bank Accounts
  private bankAccounts: Map<number, BankAccount>;
  private bankAccountIdCounter: number = 1;
  
  // Payments
  private payments: any[] = [];
  
  // Budgets
  private budgets: Map<number, import("../shared/types").Budget> = new Map();
  private budgetIdCounter: number = 1;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.customers = new Map();
    this.products = new Map();
    this.accounts = new Map();
    this.accountTransactions = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.notes = new Map();
    
    // Inicializar los Maps de logística
    this.vehicles = new Map();
    this.deliveryZones = new Map();
    this.deliveryRoutes = new Map();
    this.deliveries = new Map();
    this.deliveryEvents = new Map();
    this.routeAssignments = new Map();
    
    // Inicializar Maps adicionales
    this.bankAccounts = new Map();
    
    // Inicializar contadores
    this.userIdCounter = 1;
    this.supplierIdCounter = 1;
    this.customerIdCounter = 1;
    this.productIdCounter = 1;
    this.accountIdCounter = 1;
    this.accountTransactionIdCounter = 1;
    this.saleIdCounter = 1;
    this.saleItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.noteIdCounter = 1;
    
    // Inicializar contadores de logística
    this.vehicleIdCounter = 1;
    this.deliveryZoneIdCounter = 1;
    this.deliveryRouteIdCounter = 1;
    this.deliveryIdCounter = 1;
    this.deliveryEventIdCounter = 1;
    this.routeAssignmentIdCounter = 1;
    
    // Inicializar mapas web
    this.carts = new Map();
    this.cartItems = new Map();
    this.webUsers = new Map();
    
    // Inicializar mapas de categorías
    this.productCategories = new Map();
    this.productCategoryRelations = new Map();
    
    // Inicializar contadores web
    this.cartIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.webUserIdCounter = 1;
    
    // Inicializar contadores de categorías
    this.productCategoryIdCounter = 1;
    this.productCategoryRelationIdCounter = 1;
    
    this.budgets = new Map();
    this.budgetIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      active: true,
      role: insertUser.role || 'user'
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    const exists = this.users.has(id);
    if (!exists) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    
    this.users.delete(id);
  }
  
  // Suppliers
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      email: insertSupplier.email || null,
      phone: insertSupplier.phone || null,
      address: insertSupplier.address || null,
      notes: insertSupplier.notes || null,
      contactName: insertSupplier.contactName || null,
      lastPriceUpdate: insertSupplier.lastPriceUpdate || null
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }
  
  async updateSupplier(id: number, supplierData: Partial<Supplier>): Promise<Supplier> {
    const supplier = await this.getSupplier(id);
    if (!supplier) {
      throw new Error(`Proveedor con ID ${id} no encontrado`);
    }
    
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  async deleteSupplier(id: number): Promise<void> {
    const exists = this.suppliers.has(id);
    if (!exists) {
      throw new Error(`Proveedor con ID ${id} no encontrado`);
    }
    
    this.suppliers.delete(id);
  }
  
  // Customers
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = ++this.customerIdCounter;
    const customer: Customer = {
      id,
      name: insertCustomer.name,
      phone: insertCustomer.phone || null,
      email: insertCustomer.email || null,
      address: insertCustomer.address || null,
      city: insertCustomer.city || null,
      province: insertCustomer.province || null,
      notes: insertCustomer.notes || null,
      sellerId: insertCustomer.sellerId || null,
      invoiceType: insertCustomer.invoiceType || "remito",
      documentId: insertCustomer.documentId || null,
      hasCurrentAccount: true,
      currentBalance: "0",
    };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<void> {
    const exists = this.customers.has(id);
    if (!exists) {
      throw new Error(`Cliente con ID ${id} no encontrado`);
    }
    
    this.customers.delete(id);
  }
  
  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { 
      id,
      name: insertProduct.name,
      active: insertProduct.active ?? true,
      description: insertProduct.description || null,
      baseUnit: insertProduct.baseUnit || "unidad",
      barcodes: insertProduct.barcodes || null,
      price: insertProduct.price || "0",
      cost: insertProduct.cost || null,
      stock: insertProduct.stock || "0",
      stockAlert: insertProduct.stockAlert || null,
      webVisible: insertProduct.webVisible ?? true,
      isRefrigerated: insertProduct.isRefrigerated ?? false,
      isComposite: insertProduct.isComposite ?? false,
      components: insertProduct.components || null,
      conversionRates: insertProduct.conversionRates || null,
      isBulk: insertProduct.isBulk ?? false,
      supplierId: insertProduct.supplierId || null,
      supplierCode: insertProduct.supplierCode || null,
      category: insertProduct.category || null,
      imageUrl: insertProduct.imageUrl || null,
      iva: insertProduct.iva || "21",
      shipping: insertProduct.shipping || "0",
      profit: insertProduct.profit || "30"
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    console.log(`[updateProduct] Actualizando producto con ID ${id} con datos:`, productData);
    
    const product = await this.getProduct(id);
    if (!product) {
      console.error(`[updateProduct] ERROR: Producto con ID ${id} no encontrado`);
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    
    console.log(`[updateProduct] Producto original:`, product);
    
    // Asegurar que lastUpdated se actualice como Date
    const updatedProduct = { 
      ...product, 
      ...productData,
      lastUpdated: new Date() // Siempre actualizar la fecha de última actualización como Date
    };
    console.log(`[updateProduct] Producto actualizado:`, updatedProduct);
    
    // Verificar específicamente si estamos actualizando el stock
    if (productData.stock !== undefined) {
      console.log(`[updateProduct] Actualizando stock: ${product.stock} -> ${productData.stock}`);
    }
    
    this.products.set(id, updatedProduct);
    
    // Verificar que la actualización se haya realizado correctamente
    const verifyProduct = this.products.get(id);
    console.log(`[updateProduct] Verificación después de actualizar:`, verifyProduct);
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    const exists = this.products.has(id);
    if (!exists) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    
    this.products.delete(id);
  }
  
  // Accounts
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async getAccountByCustomerId(customerId: number): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(
      (account) => account.customerId === customerId
    );
  }
  
  async getAllAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }
  
  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.accountIdCounter++;
    const account: Account = { 
      ...insertAccount, 
      id,
      balance: insertAccount.balance || "0",
      creditLimit: insertAccount.creditLimit || null,
      lastUpdated: new Date()
    };
    this.accounts.set(id, account);
    return account;
  }
  
  async updateAccount(id: number, accountData: Partial<Account>): Promise<Account> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Cuenta con ID ${id} no encontrada`);
    }
    
    const updatedAccount = { ...account, ...accountData };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<void> {
    const exists = this.accounts.has(id);
    if (!exists) {
      throw new Error(`Cuenta con ID ${id} no encontrada`);
    }
    
    this.accounts.delete(id);
  }
  
  // Account Transactions
  async getAccountTransaction(id: number): Promise<AccountTransaction | undefined> {
    return this.accountTransactions.get(id);
  }
  
  async getAccountTransactions(accountId: number): Promise<AccountTransaction[]> {
    return Array.from(this.accountTransactions.values())
      .filter(transaction => transaction.accountId === accountId)
      .sort((a, b) => {
        // Sort by timestamp in descending order (newest first)
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async createAccountTransaction(insertTransaction: any): Promise<AccountTransaction> {
    const id = this.accountTransactionIdCounter++;
    const transaction: AccountTransaction = { 
      ...insertTransaction, 
      id,
      timestamp: new Date() 
    };
    this.accountTransactions.set(id, transaction);
    return transaction;
  }
  
  // Sales
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async getAllSales(): Promise<Sale[]> {
    return Array.from(this.sales.values())
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.saleIdCounter++;
    const newSale: Sale = { 
      id,
      timestamp: new Date(),
      userId: insertSale.userId,
      total: insertSale.total,
      subtotal: insertSale.subtotal,
      discount: insertSale.discount || "0",
      surcharge: insertSale.surcharge || "0",
      discountPercent: insertSale.discountPercent || "0",
      surchargePercent: insertSale.surchargePercent || "0",
      paymentMethod: insertSale.paymentMethod,
      paymentDetails: insertSale.paymentDetails || null,
      documentType: insertSale.documentType || "remito",
      invoiceNumber: insertSale.invoiceNumber || null,
      status: insertSale.status || 'completed',
      notes: insertSale.notes || null,
      customerId: insertSale.customerId || null,
      printOptions: insertSale.printOptions || null
    };
    
    this.sales.set(id, newSale);
    return newSale;
  }
  
  async updateSale(id: number, saleData: Partial<Sale>): Promise<Sale> {
    const sale = await this.getSale(id);
    if (!sale) {
      throw new Error(`Venta con ID ${id} no encontrada`);
    }
    
    const updatedSale = { ...sale, ...saleData };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }
  
  async deleteSale(id: number): Promise<void> {
    const exists = this.sales.has(id);
    if (!exists) {
      throw new Error(`Venta con ID ${id} no encontrada`);
    }
    
    this.sales.delete(id);
  }
  
  // Sale Items
  async getSaleItem(id: number): Promise<SaleItem | undefined> {
    return this.saleItems.get(id);
  }
  
  async getSaleItemsBySaleId(saleId: number): Promise<SaleItem[]> {
    return Array.from(this.saleItems.values())
      .filter(item => item.saleId === saleId);
  }
  
  async createSaleItem(item: InsertSaleItem): Promise<SaleItem> {
    const id = this.saleItemIdCounter++;
    const saleItem: SaleItem = { 
      ...item, 
      id,
      discount: item.discount || null,
      isConversion: item.isConversion || null,
      conversionFactor: item.conversionFactor || null,
      conversionUnit: item.conversionUnit || null,
      conversionBarcode: item.conversionBarcode || null
    };
    this.saleItems.set(id, saleItem);

    // Actualizar el stock del producto
    try {
      const product = await this.getProduct(item.productId);
      if (product) {
        console.log(`[STOCK-VENTA] Actualizando stock para producto: "${product.name}", ID: ${product.id}, Stock actual: ${product.stock}, Cantidad vendida: ${item.quantity}`);
        
        // Verificar si el producto es compuesto (un combo)
        if (product.isComposite && product.components) {
          // Parseamos los componentes si están en formato string
          let components = [];
          try {
            components = typeof product.components === 'string' 
              ? JSON.parse(product.components) 
              : product.components;
            
            console.log("[STOCK-VENTA] Componentes del producto:", components);
          } catch (error) {
            console.error("[STOCK-VENTA] Error al parsear componentes del producto:", error);
            components = [];
          }
          
          // Por cada componente, actualizamos su stock
          for (const component of components) {
            const componentProduct = await this.getProduct(component.productId);
            if (componentProduct) {
              // Calcular la cantidad total a descontar (cantidad de venta * cantidad por componente)
              const quantityToDeduct = parseFloat(item.quantity) * parseFloat(component.quantity);
              const currentComponentStock = parseFloat(componentProduct.stock.toString());
              const currentReservedStock = parseFloat(componentProduct.reservedStock?.toString() || "0");
              
              // Verificar si hay suficiente stock disponible
              if (currentComponentStock < quantityToDeduct) {
                throw new Error(`Stock insuficiente para el componente ${componentProduct.name}. Stock disponible: ${currentComponentStock}, Cantidad requerida: ${quantityToDeduct}`);
              }
              
              // Si hay stock reservado, lo liberamos primero
              const newStock = currentComponentStock - quantityToDeduct;
              const newReservedStock = Math.max(0, currentReservedStock - quantityToDeduct);
              
              console.log(`[STOCK-VENTA] Actualizando stock de componente: "${componentProduct.name}"`);
              console.log(`Stock anterior: ${currentComponentStock}, Nuevo stock: ${newStock}`);
              console.log(`Stock reservado anterior: ${currentReservedStock}, Nuevo stock reservado: ${newReservedStock}`);
              
              // Actualizar el stock y stock reservado del componente
              await this.updateProduct(component.productId, { 
                stock: newStock.toString(),
                reservedStock: newReservedStock.toString()
              });
            }
          }
        } else {
          // Verificar si necesitamos aplicar factor de conversión
          let stockToDeduct = parseFloat(item.quantity);
          
          // Verificar si la unidad del item es diferente a la unidad base del producto
          if (product.baseUnit && item.unit && item.unit !== product.baseUnit && product.conversionRates) {
            const conversions = typeof product.conversionRates === 'string' 
              ? JSON.parse(product.conversionRates) 
              : product.conversionRates;
            
            if (conversions && conversions[item.unit] && conversions[item.unit].factor) {
              const conversionFactor = parseFloat(conversions[item.unit].factor);
              stockToDeduct = stockToDeduct * conversionFactor;
              console.log(`[STOCK-VENTA] Aplicando factor de conversión ${conversionFactor} para ${item.unit}`);
              console.log(`[STOCK-VENTA] Cantidad original ${item.quantity}, cantidad a descontar del stock: ${stockToDeduct}`);
            }
          }
          
          const currentStock = parseFloat(product.stock.toString());
          const currentReservedStock = parseFloat(product.reservedStock?.toString() || "0");
          
          // Verificar si hay suficiente stock disponible
          if (currentStock < stockToDeduct) {
            throw new Error(`Stock insuficiente para el producto ${product.name}. Stock disponible: ${currentStock}, Cantidad requerida: ${stockToDeduct}`);
          }
          
          // Si hay stock reservado, lo liberamos primero
          const newStock = currentStock - stockToDeduct;
          const newReservedStock = Math.max(0, currentReservedStock - stockToDeduct);
          
          console.log(`[STOCK-VENTA] Actualizando stock del producto: "${product.name}"`);
          console.log(`Stock anterior: ${currentStock}, Nuevo stock: ${newStock}`);
          console.log(`Stock reservado anterior: ${currentReservedStock}, Nuevo stock reservado: ${newReservedStock}`);
          
          const updateResult = await this.updateProduct(item.productId, { 
            stock: newStock.toString(),
            reservedStock: newReservedStock.toString()
          });
          
          console.log("[STOCK-VENTA] Resultado de la actualización del stock:", updateResult ? "OK" : "ERROR");
        }
      } else {
        console.error(`[STOCK-VENTA] No se encontró el producto con ID ${item.productId}`);
      }
    } catch (error) {
      console.error("[STOCK-VENTA] Error al actualizar el stock del producto:", error);
      throw error; // Propagar el error para manejarlo en el endpoint
    }
    
    return saleItem;
  }
  
  // Orders
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => {
        // Sort by timestamp in descending order (newest first)
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      });
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { 
      ...insertOrder, 
      id,
      status: insertOrder.status || 'pending',
      notes: insertOrder.notes || null,
      customerId: insertOrder.customerId || null,
      timestamp: new Date(),
      deliveryDate: insertOrder.deliveryDate || null,
      isWebOrder: insertOrder.isWebOrder || null,
      source: insertOrder.source || null
    };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error(`Pedido con ID ${id} no encontrado`);
    }
    
    const updatedOrder = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<void> {
    const exists = this.orders.has(id);
    if (!exists) {
      throw new Error(`Pedido con ID ${id} no encontrado`);
    }
    
    this.orders.delete(id);
  }
  
  // Order Items
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }
  
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const item: OrderItem = { ...insertItem, id };
    this.orderItems.set(id, item);
    
    // Reservar stock del producto
    try {
      const product = await this.getProduct(insertItem.productId);
      if (product) {
        console.log(`[STOCK-ORDEN] Reservando stock para producto: "${product.name}", ID: ${product.id}, Stock actual: ${product.stock}, Cantidad a reservar: ${insertItem.quantity}`);
        
        // Verificar si el producto es compuesto (un combo)
        if (product.isComposite && product.components) {
          // Parseamos los componentes si están en formato string
          let components = [];
          try {
            components = typeof product.components === 'string' 
              ? JSON.parse(product.components) 
              : product.components;
            
            console.log("[STOCK-ORDEN] Componentes del producto:", components);
          } catch (error) {
            console.error("[STOCK-ORDEN] Error al parsear componentes del producto:", error);
            components = [];
          }
          
          // Por cada componente, reservamos su stock proporcionalmente
          for (const component of components) {
            const componentProduct = await this.getProduct(component.productId);
            if (componentProduct) {
              // Calcular la cantidad total a reservar (cantidad de venta * cantidad por componente)
              const quantityToReserve = parseFloat(insertItem.quantity) * parseFloat(component.quantity);
              const currentComponentStock = parseFloat(componentProduct.stock.toString());
              const currentReservedStock = parseFloat(componentProduct.reservedStock?.toString() || "0");
              
              // Verificar si hay suficiente stock disponible
              if (currentComponentStock - currentReservedStock < quantityToReserve) {
                throw new Error(`Stock insuficiente para el componente ${componentProduct.name}. Stock disponible: ${currentComponentStock - currentReservedStock}, Cantidad requerida: ${quantityToReserve}`);
              }
              
              const newReservedStock = currentReservedStock + quantityToReserve;
              
              console.log(`[STOCK-ORDEN] Reservando stock de componente: "${componentProduct.name}", Stock reservado anterior: ${currentReservedStock}, Cantidad a reservar: ${quantityToReserve}, Nuevo stock reservado: ${newReservedStock}`);
              
              // Actualizar el stock reservado del componente
              await this.updateProduct(component.productId, { 
                reservedStock: newReservedStock.toString() 
              });
            }
          }
        } else {
          // Verificar si necesitamos aplicar factor de conversión
          let stockToReserve = parseFloat(insertItem.quantity);
          
          // Verificar si la unidad del item es diferente a la unidad base del producto
          if (product.baseUnit && insertItem.unit && insertItem.unit !== product.baseUnit && product.conversionRates) {
            const conversions = typeof product.conversionRates === 'string' 
              ? JSON.parse(product.conversionRates) 
              : product.conversionRates;
            
            if (conversions && conversions[insertItem.unit] && conversions[insertItem.unit].factor) {
              const conversionFactor = parseFloat(conversions[insertItem.unit].factor);
              stockToReserve = stockToReserve * conversionFactor;
              console.log(`[STOCK-ORDEN] Aplicando factor de conversión ${conversionFactor} para ${insertItem.unit}`);
              console.log(`[STOCK-ORDEN] Cantidad original ${insertItem.quantity}, cantidad a reservar del stock: ${stockToReserve}`);
            }
          }
          
          const currentStock = parseFloat(product.stock.toString());
          const currentReservedStock = parseFloat(product.reservedStock?.toString() || "0");
          
          // Verificar si hay suficiente stock disponible
          if (currentStock - currentReservedStock < stockToReserve) {
            throw new Error(`Stock insuficiente para el producto ${product.name}. Stock disponible: ${currentStock - currentReservedStock}, Cantidad requerida: ${stockToReserve}`);
          }
          
          const newReservedStock = currentReservedStock + stockToReserve;
          console.log(`[STOCK-ORDEN] Actualizando stock reservado - Stock anterior: ${currentStock}, Stock reservado anterior: ${currentReservedStock}, Cantidad a reservar: ${stockToReserve}, Nuevo stock reservado: ${newReservedStock}`);
          
          const updateResult = await this.updateProduct(insertItem.productId, { 
            reservedStock: newReservedStock.toString() 
          });
          
          console.log("[STOCK-ORDEN] Resultado de la actualización del stock reservado:", updateResult ? "OK" : "ERROR");
        }
      } else {
        console.error(`[STOCK-ORDEN] No se encontró el producto con ID ${insertItem.productId}`);
      }
    } catch (error) {
      console.error("[STOCK-ORDEN] Error al reservar el stock del producto:", error);
      throw error; // Propagar el error para manejarlo en el endpoint
    }
    
    return item;
  }
  
  async deleteOrderItems(orderId: number): Promise<void> {
    const items = await this.getOrderItemsByOrderId(orderId);
    items.forEach(item => this.orderItems.delete(item.id));
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    const exists = this.orderItems.has(id);
    if (!exists) {
      return false;
    }
    this.orderItems.delete(id);
    return true;
  }
  
  // Notes (Credit/Debit)
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { 
      ...insertNote, 
      id,
      notes: insertNote.notes || null,
      customerId: insertNote.customerId || null,
      timestamp: new Date(),
      relatedSaleId: insertNote.relatedSaleId || null
    };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, noteData: Partial<Note>): Promise<Note> {
    const note = await this.getNote(id);
    if (!note) {
      throw new Error(`Nota con ID ${id} no encontrada`);
    }
    
    const updatedNote = { ...note, ...noteData };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: number): Promise<void> {
    const exists = this.notes.has(id);
    if (!exists) {
      throw new Error(`Nota con ID ${id} no encontrada`);
    }
    
    this.notes.delete(id);
  }
  
  // Vehicles
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(vehicle => vehicle.active);
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      active: insertVehicle.active ?? true,
      notes: insertVehicle.notes || null,
      maxCapacity: insertVehicle.maxCapacity || null,
      refrigerated: insertVehicle.refrigerated || null
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  
  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) {
      throw new Error(`Vehículo con ID ${id} no encontrado`);
    }
    
    const updatedVehicle = { ...vehicle, ...vehicleData };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<void> {
    const exists = this.vehicles.has(id);
    if (!exists) {
      throw new Error(`Vehículo con ID ${id} no encontrado`);
    }
    
    // Marcamos como inactivo en lugar de eliminar
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      this.vehicles.set(id, { ...vehicle, active: false });
    }
  }
  
  // Delivery Zones
  async getDeliveryZone(id: number): Promise<DeliveryZone | undefined> {
    return this.deliveryZones.get(id);
  }
  
  async getAllDeliveryZones(): Promise<DeliveryZone[]> {
    return Array.from(this.deliveryZones.values()).filter(zone => zone.active);
  }
  
  async createDeliveryZone(zone: InsertDeliveryZone): Promise<DeliveryZone> {
    const id = this.deliveryZoneIdCounter++;
    const deliveryZone: DeliveryZone = { 
      ...zone, 
      id,
      active: zone.active ?? true,
      description: zone.description || null,
      coordinates: zone.coordinates || null,
      estimatedDeliveryTime: zone.estimatedDeliveryTime || null,
      deliveryDays: zone.deliveryDays || null
    };
    this.deliveryZones.set(id, deliveryZone);
    return deliveryZone;
  }
  
  async updateDeliveryZone(id: number, zoneData: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const zone = await this.getDeliveryZone(id);
    if (!zone) {
      throw new Error(`Zona de entrega con ID ${id} no encontrada`);
    }
    
    const updatedZone = { ...zone, ...zoneData };
    this.deliveryZones.set(id, updatedZone);
    return updatedZone;
  }
  
  async deleteDeliveryZone(id: number): Promise<void> {
    const exists = this.deliveryZones.has(id);
    if (!exists) {
      throw new Error(`Zona de entrega con ID ${id} no encontrada`);
    }
    
    // Marcamos como inactivo en lugar de eliminar
    const zone = this.deliveryZones.get(id);
    if (zone) {
      this.deliveryZones.set(id, { ...zone, active: false });
    }
  }
  
  // Delivery Routes
  async getDeliveryRoute(id: number): Promise<DeliveryRoute | undefined> {
    return this.deliveryRoutes.get(id);
  }
  
  async getAllDeliveryRoutes(): Promise<DeliveryRoute[]> {
    return Array.from(this.deliveryRoutes.values()).filter(route => route.active);
  }
  
  async getDeliveryRoutesByZone(zoneId: number): Promise<DeliveryRoute[]> {
    return Array.from(this.deliveryRoutes.values())
      .filter(route => route.zoneId === zoneId && route.active);
  }
  
  async createDeliveryRoute(route: InsertDeliveryRoute): Promise<DeliveryRoute> {
    const id = this.deliveryRouteIdCounter++;
    const deliveryRoute: DeliveryRoute = { 
      ...route, 
      id,
      active: route.active ?? true,
      description: route.description || null,
      zoneId: route.zoneId || null,
      optimizedPath: route.optimizedPath || null,
      estimatedDuration: route.estimatedDuration || null,
      distance: route.distance || null
    };
    this.deliveryRoutes.set(id, deliveryRoute);
    return deliveryRoute;
  }
  
  async updateDeliveryRoute(id: number, routeData: Partial<DeliveryRoute>): Promise<DeliveryRoute> {
    const route = await this.getDeliveryRoute(id);
    if (!route) {
      throw new Error(`Ruta de entrega con ID ${id} no encontrada`);
    }
    
    const updatedRoute = { ...route, ...routeData };
    this.deliveryRoutes.set(id, updatedRoute);
    return updatedRoute;
  }
  
  async deleteDeliveryRoute(id: number): Promise<void> {
    const exists = this.deliveryRoutes.has(id);
    if (!exists) {
      throw new Error(`Ruta de entrega con ID ${id} no encontrada`);
    }
    
    // Marcamos como inactivo en lugar de eliminar
    const route = this.deliveryRoutes.get(id);
    if (route) {
      this.deliveryRoutes.set(id, { ...route, active: false });
    }
  }
  
  // Deliveries
  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }
  
  async getAllDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .sort((a, b) => {
        // Sort by scheduledDate in descending order (newest first)
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      });
  }
  
  async getDeliveriesByStatus(status: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.status === status)
      .sort((a, b) => {
        // Sort by scheduledDate in descending order (newest first)
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      });
  }
  
  async getDeliveriesByDriver(driverId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.driverId === driverId)
      .sort((a, b) => {
        // Sort by scheduledDate in descending order (newest first)
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      });
  }
  
  async getDeliveriesByCustomer(customerId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.customerId === customerId)
      .sort((a, b) => {
        // Sort by scheduledDate in descending order (newest first)
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      });
  }
  
  async getDeliveriesByDate(date: Date): Promise<Delivery[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.deliveries.values())
      .filter(delivery => {
        const scheduledDate = new Date(delivery.scheduledDate);
        return scheduledDate >= startOfDay && scheduledDate <= endOfDay;
      })
      .sort((a, b) => {
        // Sort by scheduledDate in ascending order (earliest first)
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
  }
  
  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const id = this.deliveryIdCounter++;
    const trackingCode = `PUNTO-${id.toString().padStart(6, '0')}`;
    
    const newDelivery: Delivery = { 
      id,
      status: (delivery.status || 'pending') as 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled',
      customerId: delivery.customerId || null,
      userId: delivery.userId,
      saleId: delivery.saleId || null,
      orderId: delivery.orderId,
      trackingCode,
      scheduledDate: delivery.scheduledDate,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime || null,
      actualDeliveryTime: null,
      vehicleId: delivery.vehicleId || null,
      driverId: delivery.driverId || null,
      routeId: delivery.routeId || null,
      deliveryAddress: delivery.deliveryAddress,
      deliveryNotes: delivery.deliveryNotes || null,
      recipientName: delivery.recipientName || null,
      recipientPhone: delivery.recipientPhone || null,
      priority: delivery.priority || 0,
      requiresRefrigeration: delivery.requiresRefrigeration || false,
      proof: null,
      deliveryPosition: null,
      requestSignature: delivery.requestSignature || false,
      signatureUrl: null,
      totalWeight: delivery.totalWeight || null
    };
    
    this.deliveries.set(id, newDelivery);
    return newDelivery;
  }
  
  async updateDelivery(id: number, deliveryData: Partial<Delivery>): Promise<Delivery> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      throw new Error(`Entrega con ID ${id} no encontrada`);
    }
    
    // Si hay cambio de status, creamos un evento
    if (deliveryData.status && deliveryData.status !== delivery.status) {
      await this.createDeliveryEvent({
        deliveryId: id,
        eventType: 'status_change',
        description: `Estado cambiado de '${delivery.status}' a '${deliveryData.status}'`,
        userId: delivery.userId
      });
    }
    
    const updatedDelivery = { ...delivery, ...deliveryData };
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }
  
  async updateDeliveryStatus(id: number, status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled', userId: number): Promise<Delivery> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      throw new Error(`Entrega con ID ${id} no encontrada`);
    }
    
    // Crear evento de cambio de status
    await this.createDeliveryEvent({
      deliveryId: id,
      eventType: 'status_change',
      description: `Estado cambiado de '${delivery.status}' a '${status}'`,
      userId: userId
    });
    
    // Si es entregado, actualizamos la fecha de entrega
    let extraData = {};
    if (status === 'delivered') {
      extraData = { actualDeliveryTime: new Date() };
    }
    
    const updatedDelivery = { ...delivery, status, ...extraData };
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }
  
  async deleteDelivery(id: number): Promise<void> {
    const exists = this.deliveries.has(id);
    if (!exists) {
      throw new Error(`Entrega con ID ${id} no encontrada`);
    }
    
    // En vez de eliminar, marcar como cancelada
    const delivery = this.deliveries.get(id);
    if (delivery) {
      this.deliveries.set(id, { ...delivery, status: 'cancelled' });
      
      // Crear evento de cancelación
      await this.createDeliveryEvent({
        deliveryId: id,
        eventType: 'status_change',
        description: `Entrega cancelada`,
        userId: delivery.userId
      });
    }
  }
  
  // Delivery Events
  async getDeliveryEvent(id: number): Promise<DeliveryEvent | undefined> {
    return this.deliveryEvents.get(id);
  }
  
  async getDeliveryEventsByDelivery(deliveryId: number): Promise<DeliveryEvent[]> {
    return Array.from(this.deliveryEvents.values())
      .filter(event => event.deliveryId === deliveryId)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateA - dateB;
      });
  }
  
  async createDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent> {
    const id = this.deliveryEventIdCounter++;
    const deliveryEvent: DeliveryEvent = { 
      ...event, 
      id,
      timestamp: new Date(),
      userId: event.userId || null,
      location: event.location || null,
      metadata: event.metadata || null
    };
    this.deliveryEvents.set(id, deliveryEvent);
    return deliveryEvent;
  }
  
  // Route Assignments
  async getRouteAssignment(id: number): Promise<RouteAssignment | undefined> {
    return this.routeAssignments.get(id);
  }
  
  async getRouteAssignmentsByDate(date: Date): Promise<RouteAssignment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.routeAssignments.values())
      .filter(assignment => {
        const assignmentDate = new Date(assignment.date);
        return assignmentDate >= startOfDay && assignmentDate <= endOfDay;
      })
      .sort((a, b) => {
        // Sort by route ID
        return a.routeId - b.routeId;
      });
  }
  
  async getRouteAssignmentsByDriver(driverId: number): Promise<RouteAssignment[]> {
    return Array.from(this.routeAssignments.values())
      .filter(assignment => assignment.driverId === driverId)
      .sort((a, b) => {
        // Sort by date in descending order (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }
  
  async createRouteAssignment(assignment: InsertRouteAssignment): Promise<RouteAssignment> {
    const id = this.routeAssignmentIdCounter++;
    const routeAssignment: RouteAssignment = { 
      ...assignment, 
      id,
      status: assignment.status || 'pending',
      notes: assignment.notes || null,
      startTime: assignment.startTime || null,
      endTime: assignment.endTime || null
    };
    this.routeAssignments.set(id, routeAssignment);
    return routeAssignment;
  }
  
  async updateRouteAssignment(id: number, assignmentData: Partial<RouteAssignment>): Promise<RouteAssignment> {
    const assignment = await this.getRouteAssignment(id);
    if (!assignment) {
      throw new Error(`Asignación de ruta con ID ${id} no encontrada`);
    }
    
    const updatedAssignment = { ...assignment, ...assignmentData };
    this.routeAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteRouteAssignment(id: number): Promise<void> {
    const exists = this.routeAssignments.has(id);
    if (!exists) {
      throw new Error(`Asignación de ruta con ID ${id} no encontrada`);
    }
    
    // En vez de eliminar, marcar como cancelada
    const assignment = this.routeAssignments.get(id);
    if (assignment) {
      this.routeAssignments.set(id, { ...assignment, status: 'cancelled' });
    }
  }
  
  // Web Cart methods
  async getCart(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }
  
  async getCartsBySessionId(sessionId: string): Promise<Cart[]> {
    return Array.from(this.carts.values())
      .filter(cart => cart.sessionId === sessionId);
  }
  
  async createCart(insertCart: InsertCart): Promise<Cart> {
    const id = this.cartIdCounter++;
    const cart: Cart = {
      ...insertCart,
      id,
      status: insertCart.status || null,
      createdAt: new Date(),
      webUserId: insertCart.webUserId || null,
      sessionId: insertCart.sessionId || null,
      updatedAt: new Date(),
      totalItems: 0,
      totalAmount: "0"
    };
    this.carts.set(id, cart);
    return cart;
  }
  
  async updateCart(id: number, cartData: Partial<Cart>): Promise<Cart> {
    const cart = await this.getCart(id);
    if (!cart) {
      throw new Error(`Carrito con ID ${id} no encontrado`);
    }
    
    const updatedCart = { 
      ...cart, 
      ...cartData,
      updatedAt: new Date()
    };
    this.carts.set(id, updatedCart);
    return updatedCart;
  }
  
  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }
  
  async getCartItemsByCartId(cartId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values())
      .filter(item => item.cartId === cartId);
  }
  
  async createCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemIdCounter++;
    const item: CartItem = { 
      id,
      cartId: insertItem.cartId,
      productId: insertItem.productId,
      price: insertItem.price,
      quantity: insertItem.quantity,
      unit: insertItem.unit,
      notes: insertItem.notes || null,
      updatedAt: new Date(),
      addedAt: new Date()
    };
    this.cartItems.set(id, item);
    
    // Actualizar el carrito
    const cart = await this.getCart(insertItem.cartId);
    if (cart) {
      const cartItems = await this.getCartItemsByCartId(cart.id);
      const total = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0).toString();
      
      await this.updateCart(cart.id, { 
        totalItems: cartItems.length + 1,
        totalAmount: total
      });
    }
    
    return item;
  }
  
  async deleteCartItem(id: number): Promise<void> {
    const item = this.cartItems.get(id);
    if (!item) {
      throw new Error(`Item de carrito con ID ${id} no encontrado`);
    }
    
    // Actualizar el carrito antes de eliminar el item
    const cart = await this.getCart(item.cartId);
    if (cart) {
      const cartItems = await this.getCartItemsByCartId(cart.id);
      const filteredItems = cartItems.filter(i => i.id !== id);
      const total = filteredItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0).toString();
      
      await this.updateCart(cart.id, { 
        totalItems: filteredItems.length,
        totalAmount: total
      });
    }
    
    this.cartItems.delete(id);
  }
  
  // Web User methods
  async getWebUserByUsername(username: string): Promise<WebUser | undefined> {
    return Array.from(this.webUsers.values()).find(
      (user) => user.email === username
    );
  }

  async createWebUser(insertWebUser: InsertWebUser): Promise<WebUser> {
    const id = this.webUserIdCounter++;
    const webUser: WebUser = { 
      ...insertWebUser, 
      id,
      active: true,
      customerId: insertWebUser.customerId || null,
      verificationToken: insertWebUser.verificationToken || null,
      verified: insertWebUser.verified || null,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null,
      createdAt: new Date()
    };
    this.webUsers.set(id, webUser);
    return webUser;
  }
  
  // Product Categories
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    return this.productCategories.get(id);
  }
  
  async getAllProductCategories(): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values());
  }
  
  async getProductCategoriesByParentId(parentId: number | null): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values())
      .filter(category => {
        if (parentId === null) {
          return category.parentId === null || category.parentId === undefined;
        }
        return category.parentId === parentId;
      });
  }
  
  async getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined> {
    return Array.from(this.productCategories.values())
      .find(category => category.slug === slug);
  }
  
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const id = this.productCategoryIdCounter++;
    const newCategory: ProductCategory = {
      id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      imageUrl: category.imageUrl || null,
      parentId: category.parentId || null,
      displayOrder: category.displayOrder || 0,
      active: category.active ?? true,
      metaTitle: category.metaTitle || null,
      metaDescription: category.metaDescription || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productCategories.set(id, newCategory);
    return newCategory;
  }
  
  async updateProductCategory(id: number, categoryData: Partial<ProductCategory>): Promise<ProductCategory> {
    const category = await this.getProductCategory(id);
    if (!category) {
      throw new Error(`Categoría con ID ${id} no encontrada`);
    }
    
    const updatedCategory = { ...category, ...categoryData };
    this.productCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteProductCategory(id: number): Promise<void> {
    const exists = this.productCategories.has(id);
    if (!exists) {
      throw new Error(`Categoría con ID ${id} no encontrada`);
    }
    
    // Verificar si hay categorías hijas que dependen de esta
    const hasChildren = Array.from(this.productCategories.values())
      .some(category => category.parentId === id);
      
    if (hasChildren) {
      throw new Error(`No se puede eliminar la categoría porque tiene subcategorías asignadas`);
    }
    
    // Eliminar las relaciones de productos con esta categoría
    const relationKeysToDelete: number[] = [];
    this.productCategoryRelations.forEach((relation, key) => {
      if (relation.categoryId === id) {
        relationKeysToDelete.push(key);
      }
    });
    
    relationKeysToDelete.forEach(key => {
      this.productCategoryRelations.delete(key);
    });
    
    this.productCategories.delete(id);
  }
  
  // Product Category Relations
  async getProductCategoriesByProductId(productId: number): Promise<ProductCategory[]> {
    const categoryIds = Array.from(this.productCategoryRelations.values())
      .filter(relation => relation.productId === productId)
      .map(relation => relation.categoryId);
      
    return Array.from(this.productCategories.values())
      .filter(category => categoryIds.includes(category.id));
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const productIds = Array.from(this.productCategoryRelations.values())
      .filter(relation => relation.categoryId === categoryId)
      .map(relation => relation.productId);
      
    return Array.from(this.products.values())
      .filter(product => productIds.includes(product.id));
  }
  
  async addProductToCategory(productId: number, categoryId: number): Promise<ProductCategoryRelation> {
    // Verificar si el producto existe
    const productExists = this.products.has(productId);
    if (!productExists) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }
    
    // Verificar si la categoría existe
    const categoryExists = this.productCategories.has(categoryId);
    if (!categoryExists) {
      throw new Error(`Categoría con ID ${categoryId} no encontrada`);
    }
    
    // Verificar si ya existe la relación
    const alreadyExists = Array.from(this.productCategoryRelations.values())
      .some(relation => relation.productId === productId && relation.categoryId === categoryId);
      
    if (alreadyExists) {
      throw new Error(`El producto ya está asignado a esta categoría`);
    }
    
    const id = this.productCategoryRelationIdCounter++;
    const relation: ProductCategoryRelation = {
      id,
      productId,
      categoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPrimary: false
    };
    
    this.productCategoryRelations.set(id, relation);
    return relation;
  }
  
  async removeProductFromCategory(productId: number, categoryId: number): Promise<void> {
    // Buscar la relación para eliminarla
    const relationKey = Array.from(this.productCategoryRelations.entries())
      .find(([_, relation]) => relation.productId === productId && relation.categoryId === categoryId)?.[0];
      
    if (!relationKey) {
      throw new Error(`Relación entre producto ${productId} y categoría ${categoryId} no encontrada`);
    }
    
    this.productCategoryRelations.delete(relationKey);
  }

  // Purchase methods
  async getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
    const items: PurchaseItem[] = [];
    for (const [_, item] of this.purchaseItems.entries()) {
      if (item.purchaseId === purchaseId) {
        items.push(item);
      }
    }
    return items;
  }

  async getPurchase(id: number): Promise<Purchase | null> {
    const purchase = this.purchases.get(id);
    if (!purchase) return null;

    const items = await this.getPurchaseItems(id);
    const purchaseWithItems: Purchase = {
      ...purchase,
      items,
    };
    return purchaseWithItems;
  }

  async getPurchases(): Promise<Purchase[]> {
    const purchases: Purchase[] = [];
    for (const purchase of Array.from(this.purchases.values())) {
      const items = await this.getPurchaseItems(purchase.id);
      purchases.push({
        ...purchase,
        items,
      });
    }
    return purchases;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.purchaseIdCounter++;
    const purchase: StoragePurchase = {
      id,
      timestamp: new Date(),
      supplierId: insertPurchase.supplierId,
      userId: insertPurchase.userId,
      total: insertPurchase.total.toString(),
      paymentMethod: insertPurchase.paymentMethod,
      paymentDetails: insertPurchase.paymentDetails || null,
      documentType: insertPurchase.documentType || "remito",
      invoiceNumber: insertPurchase.invoiceNumber || null,
      status: insertPurchase.status || "completed",
      notes: insertPurchase.notes || null,
    };
    this.purchases.set(id, purchase);

    // Crear los items de la compra
    const items: PurchaseItem[] = [];
    if (insertPurchase.items && insertPurchase.items.length > 0) {
      for (const item of insertPurchase.items) {
        const itemId = this.purchaseItemIdCounter++;
        const purchaseItem: PurchaseItem = {
          id: itemId,
          purchaseId: id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unit: item.unit,
          cost: item.cost.toString(),
          total: (item.quantity * item.cost).toString(),
          isConversion: false,
          conversionFactor: "1",
          conversionUnit: null,
          conversionBarcode: null,
        };
        this.purchaseItems.set(itemId, purchaseItem);
        items.push(purchaseItem);
      }
    }

    return {
      ...purchase,
      items,
    };
  }

  async updatePurchase(id: number, updatePurchase: UpdatePurchase): Promise<Purchase> {
    const purchase = this.purchases.get(id);
    if (!purchase) throw new Error("Purchase not found");

    const updatedPurchase: StoragePurchase = {
      ...purchase,
      supplierId: updatePurchase.supplierId || purchase.supplierId,
      total: updatePurchase.total?.toString() || purchase.total,
      paymentMethod: updatePurchase.paymentMethod || purchase.paymentMethod,
      paymentDetails: updatePurchase.paymentDetails || purchase.paymentDetails,
      documentType: updatePurchase.documentType || purchase.documentType,
      invoiceNumber: updatePurchase.invoiceNumber || purchase.invoiceNumber,
      status: updatePurchase.status || purchase.status,
      notes: updatePurchase.notes || purchase.notes,
    };

    this.purchases.set(id, updatedPurchase);

    // Actualizar los items de la compra
    const items: PurchaseItem[] = [];
    if (updatePurchase.items && updatePurchase.items.length > 0) {
      // Eliminar items existentes
      for (const [itemId, item] of Array.from(this.purchaseItems.entries())) {
        if (item.purchaseId === id) {
          this.purchaseItems.delete(itemId);
        }
      }

      // Crear nuevos items
      for (const item of updatePurchase.items) {
        const itemId = this.purchaseItemIdCounter++;
        const purchaseItem: PurchaseItem = {
          id: itemId,
          purchaseId: id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unit: item.unit,
          cost: item.cost.toString(),
          total: (item.quantity * item.cost).toString(),
          isConversion: false,
          conversionFactor: "1",
          conversionUnit: null,
          conversionBarcode: null,
        };
        this.purchaseItems.set(itemId, purchaseItem);
        items.push(purchaseItem);
      }
    } else {
      // Si no se proporcionan items, mantener los existentes
      const existingItems = await this.getPurchaseItems(id);
      items.push(...existingItems);
    }

    return {
      ...updatedPurchase,
      items,
    };
  }

  async deletePurchase(id: number): Promise<void> {
    this.purchases.delete(id);
  }

  async createPurchaseItem(insertItem: InsertPurchaseItem): Promise<PurchaseItem> {
    const id = this.purchaseItemIdCounter++;
    const item: PurchaseItem = {
      id,
      purchaseId: insertItem.purchaseId,
      productId: insertItem.productId,
      quantity: insertItem.quantity.toString(),
      unit: insertItem.unit,
      cost: insertItem.cost.toString(),
      total: insertItem.total.toString(),
      isConversion: insertItem.isConversion || false,
      conversionFactor: insertItem.conversionFactor?.toString() || "1",
      conversionUnit: insertItem.conversionUnit || null,
      conversionBarcode: insertItem.conversionBarcode || null
    };
    this.purchaseItems.set(id, item);
    return item;
  }

  // Bank Accounts
  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.get(id);
  }

  async getAllBankAccounts(): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values());
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const id = this.bankAccountIdCounter++;
    const account: BankAccount = {
      ...insertAccount,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bankAccounts.set(id, account);
    return account;
  }

  async updateBankAccount(id: number, updateAccount: Partial<BankAccount>): Promise<BankAccount> {
    const account = this.bankAccounts.get(id);
    if (!account) {
      throw new Error("Bank account not found");
    }
    const updatedAccount = {
      ...account,
      ...updateAccount,
      updatedAt: new Date()
    };
    this.bankAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteBankAccount(id: number): Promise<void> {
    this.bankAccounts.delete(id);
  }

  // Payments
  async createPayment(payment: any): Promise<any> {
    const newPayment = { id: this.payments.length + 1, ...payment };
    this.payments.push(newPayment);
    return newPayment;
  }

  // Budgets
  async getBudget(id: number): Promise<import("../shared/types").Budget | undefined> {
    return this.budgets.get(id);
  }

  async getAllBudgets(): Promise<import("../shared/types").Budget[]> {
    return Array.from(this.budgets.values());
  }

  async createBudget(insertBudget: import("../shared/types").InsertBudget): Promise<import("../shared/types").Budget> {
    const id = this.budgetIdCounter++;
    const timestamp = new Date();
    const items = insertBudget.items.map((item, idx) => ({
      id: idx + 1,
      budgetId: id,
      ...item
    }));
    const budget = {
      id,
      timestamp,
      customerId: insertBudget.customerId,
      userId: insertBudget.userId,
      items,
      subtotal: insertBudget.subtotal,
      discount: insertBudget.discount,
      discountPercent: insertBudget.discountPercent,
      total: insertBudget.total,
      paymentMethod: insertBudget.paymentMethod,
      observations: insertBudget.observations,
      validityDays: insertBudget.validityDays,
      status: insertBudget.status || "pending"
    };
    this.budgets.set(id, budget);
    return budget;
  }
}

export const storage = new MemStorage();
