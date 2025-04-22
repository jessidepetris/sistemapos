import { users, User, InsertUser, Supplier, InsertSupplier, Customer, InsertCustomer, 
  Product, InsertProduct, Account, InsertAccount, Sale, InsertSale, SaleItem, InsertSaleItem, 
  Order, InsertOrder, OrderItem, InsertOrderItem, Note, InsertNote, AccountTransaction, InsertAccountTransaction, 
  Vehicle, InsertVehicle, DeliveryZone, InsertDeliveryZone, DeliveryRoute, InsertDeliveryRoute, 
  Delivery, InsertDelivery, DeliveryEvent, InsertDeliveryEvent, RouteAssignment, InsertRouteAssignment, 
  Cart, InsertCart, CartItem, InsertCartItem, WebUser, InsertWebUser,
  ProductCategory, InsertProductCategory, ProductCategoryRelation, InsertProductCategoryRelation } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
    const user: User = { ...insertUser, id };
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
    const supplier: Supplier = { ...insertSupplier, id };
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
    const id = this.customerIdCounter++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    const customer = await this.getCustomer(id);
    if (!customer) {
      throw new Error(`Cliente con ID ${id} no encontrado`);
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
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
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
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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
        // Sort by timestamp in descending order (newest first)
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      });
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.saleIdCounter++;
    const sale: Sale = { 
      ...insertSale, 
      id,
      timestamp: new Date() 
    };
    this.sales.set(id, sale);
    return sale;
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
  
  async createSaleItem(insertItem: InsertSaleItem): Promise<SaleItem> {
    const id = this.saleItemIdCounter++;
    const item: SaleItem = { ...insertItem, id };
    this.saleItems.set(id, item);
    return item;
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
      timestamp: new Date() 
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
    return item;
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
      timestamp: new Date() 
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
    const vehicle: Vehicle = { ...insertVehicle, id };
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
    const deliveryZone: DeliveryZone = { ...zone, id };
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
    const deliveryRoute: DeliveryRoute = { ...route, id };
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
      ...delivery, 
      id,
      trackingCode,
      status: delivery.status || 'pending'
    };
    
    this.deliveries.set(id, newDelivery);
    
    // Crear un evento de creación
    await this.createDeliveryEvent({
      deliveryId: id,
      eventType: 'status_change',
      description: `Entrega #${id} creada con estado '${newDelivery.status}'`,
      userId: delivery.userId
    });
    
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
  
  async updateDeliveryStatus(id: number, status: string, userId: number): Promise<Delivery> {
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
        // Sort by timestamp in ascending order (oldest first)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }
  
  async createDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent> {
    const id = this.deliveryEventIdCounter++;
    const deliveryEvent: DeliveryEvent = { 
      ...event, 
      id,
      timestamp: new Date() 
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
    const routeAssignment: RouteAssignment = { ...assignment, id };
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
      createdAt: new Date(),
      updatedAt: new Date(),
      items: 0,
      total: "0"
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
    const item: CartItem = { ...insertItem, id };
    this.cartItems.set(id, item);
    
    // Actualizar el carrito
    const cart = await this.getCart(insertItem.cartId);
    if (cart) {
      const cartItems = await this.getCartItemsByCartId(cart.id);
      const total = cartItems.reduce((sum, item) => 
        sum + parseFloat(item.total), parseFloat(insertItem.total)).toString();
      
      await this.updateCart(cart.id, { 
        items: cartItems.length + 1,
        total
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
        sum + parseFloat(item.total), 0).toString();
      
      await this.updateCart(cart.id, { 
        items: filteredItems.length,
        total
      });
    }
    
    this.cartItems.delete(id);
  }
  
  // Web User methods
  async getWebUserByUsername(username: string): Promise<WebUser | undefined> {
    return Array.from(this.webUsers.values()).find(
      (user) => user.username === username
    );
  }

  async createWebUser(insertWebUser: InsertWebUser): Promise<WebUser> {
    const id = this.webUserIdCounter++;
    const webUser: WebUser = { ...insertWebUser, id };
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
  
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const id = this.productCategoryIdCounter++;
    const newCategory: ProductCategory = { ...category, id };
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
      categoryId
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
}

export const storage = new MemStorage();