import { users, User, InsertUser, Supplier, InsertSupplier, Customer, InsertCustomer, Product, InsertProduct, Account, InsertAccount, Sale, InsertSale, SaleItem, InsertSaleItem, Order, InsertOrder, OrderItem, InsertOrderItem, Note, InsertNote, AccountTransaction, InsertAccountTransaction } from "@shared/schema";
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
  
  // Session store
  sessionStore: session.SessionStore;
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
  
  sessionStore: session.SessionStore;

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
      balance: insertAccount.balance || 0,
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
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.saleIdCounter++;
    const sale: Sale = { 
      ...insertSale, 
      id,
      timestamp: insertSale.timestamp || new Date() 
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
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { 
      ...insertOrder, 
      id,
      timestamp: insertOrder.timestamp || new Date() 
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
    return Array.from(this.notes.values())
      .sort((a, b) => {
        // Sort by timestamp in descending order (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { 
      ...insertNote, 
      id,
      timestamp: insertNote.timestamp || new Date() 
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
}

export const storage = new MemStorage();
