import { 
  User, InsertUser, 
  Product, InsertProduct, 
  Category, InsertCategory,
  Customer, InsertCustomer,
  Supplier, InsertSupplier,
  Sale, InsertSale,
  SaleDetail, InsertSaleDetail,
  Order, InsertOrder,
  OrderDetail, InsertOrderDetail,
  Note, InsertNote
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  updateProductsPrice(supplierId: number, percentage: number): Promise<number>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined>;
  
  // Supplier operations
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier | undefined>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Sales operations
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale, saleDetails: InsertSaleDetail[]): Promise<Sale>;
  getSaleWithDetails(id: number): Promise<{sale: Sale, details: SaleDetail[]}>;
  getRecentSales(limit: number): Promise<Sale[]>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder, orderDetails: InsertOrderDetail[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderWithDetails(id: number): Promise<{order: Order, details: OrderDetail[]}>;
  getAllOrders(): Promise<Order[]>;
  
  // Note operations
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  getAllNotes(): Promise<Note[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private customers: Map<number, Customer>;
  private suppliers: Map<number, Supplier>;
  private sales: Map<number, Sale>;
  private saleDetails: Map<number, SaleDetail[]>;
  private orders: Map<number, Order>;
  private orderDetails: Map<number, OrderDetail[]>;
  private notes: Map<number, Note>;
  
  sessionStore: session.SessionStore;
  
  // Auto-increment IDs
  private userId: number;
  private productId: number;
  private categoryId: number;
  private customerId: number;
  private supplierId: number;
  private saleId: number;
  private saleDetailId: number;
  private orderId: number;
  private orderDetailId: number;
  private noteId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.sales = new Map();
    this.saleDetails = new Map();
    this.orders = new Map();
    this.orderDetails = new Map();
    this.notes = new Map();
    
    this.userId = 1;
    this.productId = 1;
    this.categoryId = 1;
    this.customerId = 1;
    this.supplierId = 1;
    this.saleId = 1;
    this.saleDetailId = 1;
    this.orderId = 1;
    this.orderDetailId = 1;
    this.noteId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true,
      lastLogin: timestamp
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.sku === sku,
    );
  }
  
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.barcodes?.includes(barcode),
    );
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const timestamp = new Date();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      ...productData,
      updatedAt: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.stock < product.minStock
    );
  }
  
  async updateProductsPrice(supplierId: number, percentage: number): Promise<number> {
    let updatedCount = 0;
    const products = Array.from(this.products.values()).filter(
      (product) => product.supplierId === supplierId
    );
    
    for (const product of products) {
      const newPrice = Number(product.price) * (1 + (percentage / 100));
      await this.updateProduct(product.id, { 
        price: newPrice.toString(), 
        updatedAt: new Date() 
      });
      updatedCount++;
    }
    
    return updatedCount;
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.customerId++;
    const timestamp = new Date();
    const newCustomer: Customer = { 
      ...customer, 
      id,
      createdAt: timestamp
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const currentBalance = Number(customer.currentBalance);
    const newBalance = currentBalance + amount;
    
    return this.updateCustomer(id, { currentBalance: newBalance.toString() });
  }
  
  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierId++;
    const timestamp = new Date();
    const newSupplier: Supplier = { 
      ...supplier, 
      id,
      createdAt: timestamp
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = await this.getSupplier(id);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  // Sales methods
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async createSale(sale: InsertSale, details: InsertSaleDetail[]): Promise<Sale> {
    const id = this.saleId++;
    const timestamp = new Date();
    const newSale: Sale = { 
      ...sale, 
      id,
      createdAt: timestamp
    };
    this.sales.set(id, newSale);
    
    // Create sale details
    const saleDetails: SaleDetail[] = [];
    for (const detail of details) {
      const detailId = this.saleDetailId++;
      const newDetail: SaleDetail = {
        ...detail,
        id: detailId,
        saleId: id
      };
      saleDetails.push(newDetail);
      
      // Update product stock
      const product = await this.getProduct(detail.productId);
      if (product) {
        const currentStock = Number(product.stock);
        const newStock = currentStock - Number(detail.quantity);
        await this.updateProduct(product.id, { stock: newStock.toString() });
      }
    }
    this.saleDetails.set(id, saleDetails);
    
    // Update customer balance if needed
    if (sale.customerId && sale.status === 'completed') {
      await this.updateCustomerBalance(sale.customerId, Number(sale.total));
    }
    
    return newSale;
  }
  
  async getSaleWithDetails(id: number): Promise<{sale: Sale, details: SaleDetail[]}> {
    const sale = await this.getSale(id);
    if (!sale) throw new Error(`Sale with id ${id} not found`);
    
    const details = this.saleDetails.get(id) || [];
    return { sale, details };
  }
  
  async getRecentSales(limit: number): Promise<Sale[]> {
    const allSales = Array.from(this.sales.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return allSales.slice(0, limit);
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder, details: InsertOrderDetail[]): Promise<Order> {
    const id = this.orderId++;
    const timestamp = new Date();
    const newOrder: Order = { 
      ...order, 
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.orders.set(id, newOrder);
    
    // Create order details
    const orderDetails: OrderDetail[] = [];
    for (const detail of details) {
      const detailId = this.orderDetailId++;
      const newDetail: OrderDetail = {
        ...detail,
        id: detailId,
        orderId: id
      };
      orderDetails.push(newDetail);
    }
    this.orderDetails.set(id, orderDetails);
    
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      status,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    
    // If status is 'received', update product stock
    if (status === 'received') {
      const details = this.orderDetails.get(id) || [];
      for (const detail of details) {
        const product = await this.getProduct(detail.productId);
        if (product) {
          const currentStock = Number(product.stock);
          const newStock = currentStock + Number(detail.quantity);
          await this.updateProduct(product.id, { stock: newStock.toString() });
        }
      }
    }
    
    return updatedOrder;
  }
  
  async getOrderWithDetails(id: number): Promise<{order: Order, details: OrderDetail[]}> {
    const order = await this.getOrder(id);
    if (!order) throw new Error(`Order with id ${id} not found`);
    
    const details = this.orderDetails.get(id) || [];
    return { order, details };
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  // Note methods
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async createNote(note: InsertNote): Promise<Note> {
    const id = this.noteId++;
    const timestamp = new Date();
    const newNote: Note = { 
      ...note, 
      id,
      createdAt: timestamp
    };
    this.notes.set(id, newNote);
    
    // Update customer balance if applicable
    if (note.customerId) {
      const amount = note.type === 'credit' ? -Number(note.amount) : Number(note.amount);
      await this.updateCustomerBalance(note.customerId, amount);
    }
    
    return newNote;
  }
  
  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }
  
  // Initialize demo data
  private async initializeDemoData() {
    // Create admin user
    await this.createUser({
      username: "admin",
      password: "$2b$10$WEwYPMnAamOA6dzyOxvM1.c13XGX76iEbdaRk0OlK6yYUXZfpZYz.", // "password" hashed
      fullName: "Administrador",
      email: "admin@puntopastelero.com",
      role: "admin"
    });
    
    // Create categories
    const lacteos = await this.createCategory({
      name: "Lácteos",
      description: "Productos lácteos y derivados"
    });
    
    const secos = await this.createCategory({
      name: "Productos secos",
      description: "Harinas, azúcar, y otros productos secos"
    });
    
    // Create suppliers
    const supplier1 = await this.createSupplier({
      name: "Distribuidora Láctea S.A.",
      contactName: "Juan Pérez",
      email: "juan@lacteos.com",
      phone: "123456789",
      address: "Calle Principal 123"
    });
    
    const supplier2 = await this.createSupplier({
      name: "Harinera Nacional",
      contactName: "María López",
      email: "maria@harinera.com",
      phone: "987654321",
      address: "Avenida Central 456"
    });
    
    // Create products
    await this.createProduct({
      name: "Leche Entera 1L",
      sku: "LECH001",
      description: "Leche entera pasteurizada",
      price: "150",
      cost: "100",
      stock: "15",
      minStock: "10",
      unit: "unidad",
      isRefrigerated: true,
      isBulk: false,
      barcodes: ["7790123456789"],
      categoryId: lacteos.id,
      supplierId: supplier1.id
    });
    
    await this.createProduct({
      name: "Harina 000 1kg",
      sku: "HAR001",
      description: "Harina triple cero para pastelería",
      price: "120",
      cost: "80",
      stock: "25",
      minStock: "15",
      unit: "unidad",
      isRefrigerated: false,
      isBulk: false,
      barcodes: ["7790987654321"],
      categoryId: secos.id,
      supplierId: supplier2.id
    });
    
    await this.createProduct({
      name: "Azúcar 1kg",
      sku: "AZU001",
      description: "Azúcar refinada",
      price: "95",
      cost: "65",
      stock: "4",
      minStock: "10",
      unit: "unidad",
      isRefrigerated: false,
      isBulk: false,
      barcodes: ["7790123454321"],
      categoryId: secos.id,
      supplierId: supplier2.id
    });
    
    // Create a bulk product with conversion
    await this.createProduct({
      name: "Harina a granel",
      sku: "HAR002",
      description: "Harina para pastelería a granel",
      price: "100",
      cost: "70",
      stock: "50.5",
      minStock: "20",
      unit: "kg",
      isRefrigerated: false,
      isBulk: true,
      barcodes: [],
      categoryId: secos.id,
      supplierId: supplier2.id,
      conversionFactor: "0.1",
      secondaryUnit: "g"
    });
    
    // Create customer
    const customer = await this.createCustomer({
      name: "María González",
      email: "maria@gmail.com",
      phone: "123987456",
      address: "Calle Secundaria 789",
      documentId: "28456123",
      hasCurrentAccount: true
    });
    
    // Create a sale
    const sale: InsertSale = {
      customerId: customer.id,
      userId: 1,
      total: "270",
      paymentMethod: "efectivo",
      receiptNumber: "0001-00000001",
      receiptType: "X",
      status: "completed"
    };
    
    const saleDetails: InsertSaleDetail[] = [
      {
        productId: 1,
        quantity: "1",
        unitPrice: "150",
        subtotal: "150",
        unit: "unidad",
        saleId: 0 // placeholder, overwritten in createSale
      },
      {
        productId: 2,
        quantity: "1",
        unitPrice: "120",
        subtotal: "120",
        unit: "unidad",
        saleId: 0 // placeholder, overwritten in createSale
      }
    ];
    
    await this.createSale(sale, saleDetails);
    
    // Create an order
    const order: InsertOrder = {
      supplierId: supplier1.id,
      userId: 1,
      status: "pending",
      total: "1000",
      notes: "Pedido urgente"
    };
    
    const orderDetails: InsertOrderDetail[] = [
      {
        productId: 1,
        quantity: "10",
        unitPrice: "100",
        orderId: 0 // placeholder, overwritten in createOrder
      }
    ];
    
    await this.createOrder(order, orderDetails);
  }
}

export const storage = new MemStorage();
