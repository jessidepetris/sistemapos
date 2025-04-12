import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Dashboard endpoints
  app.get("/api/dashboard/stats", (req, res) => {
    const stats = {
      todaySales: { total: "$24,500", change: "12%", trend: "up" },
      transactions: { count: "42", change: "8%", trend: "up" },
      lowStock: { count: "8" },
      newCustomers: { count: "3" }
    };
    res.json(stats);
  });

  app.get("/api/dashboard/recent-sales", (req, res) => {
    const recentSales = [
      { id: 5263, customer: "Juan Pérez", items: 8, total: 4350, timestamp: "2023-05-12T10:42:00", status: "completed" },
      { id: 5262, customer: "María García", items: 3, total: 850, timestamp: "2023-05-12T09:35:00", status: "completed" },
      { id: 5261, customer: "Carlos López", items: 5, total: 1250, timestamp: "2023-05-12T09:10:00", status: "pending" },
      { id: 5260, customer: "Ana Rodríguez", items: 12, total: 6780, timestamp: "2023-05-11T16:22:00", status: "completed" },
      { id: 5259, customer: "Miguel Hernández", items: 2, total: 320, timestamp: "2023-05-11T15:45:00", status: "processing" }
    ];
    res.json(recentSales);
  });

  app.get("/api/dashboard/inventory-alerts", (req, res) => {
    const inventoryAlerts = [
      { id: 1, product: "Leche Entera 1L", stock: 5, unit: "unidades", level: "critical" },
      { id: 2, product: "Queso Cremoso", stock: 8, unit: "unidades", level: "warning" },
      { id: 3, product: "Yogur Natural 500g", stock: 12, unit: "unidades", level: "warning" },
      { id: 4, product: "Manteca 200g", stock: 3, unit: "unidades", level: "critical" }
    ];
    res.json(inventoryAlerts);
  });

  app.get("/api/dashboard/recent-activity", (req, res) => {
    const recentActivity = [
      { id: 1, user: "María García", action: "generó un remito", timeAgo: "Hace 15 minutos", type: "sale" },
      { id: 2, user: "Juan Pérez", action: "agregó 10 productos al inventario", timeAgo: "Hace 42 minutos", type: "inventory" },
      { id: 3, user: "Carlos López", action: "actualizó precios", timeAgo: "Hace 1 hora", type: "price" },
      { id: 4, user: "Ana Rodríguez", action: "registró un nuevo cliente", timeAgo: "Hace 3 horas", type: "customer" }
    ];
    res.json(recentActivity);
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener productos", error: (error as Error).message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Error al crear producto", error: (error as Error).message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar producto", error: (error as Error).message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar producto", error: (error as Error).message });
    }
  });

  // Suppliers endpoints
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedores", error: (error as Error).message });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Error al crear proveedor", error: (error as Error).message });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar proveedor", error: (error as Error).message });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar proveedor", error: (error as Error).message });
    }
  });

  // Customers endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes", error: (error as Error).message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Error al crear cliente", error: (error as Error).message });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar cliente", error: (error as Error).message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar cliente", error: (error as Error).message });
    }
  });

  // Accounts endpoints
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      const accountsWithCustomer = await Promise.all(
        accounts.map(async (account) => {
          if (account.customerId) {
            const customer = await storage.getCustomer(account.customerId);
            return { ...account, customer };
          }
          return account;
        })
      );
      res.json(accountsWithCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cuentas", error: (error as Error).message });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const account = await storage.createAccount(req.body);
      // Update the customer to have hasAccount = true
      if (account.customerId) {
        await storage.updateCustomer(account.customerId, { hasAccount: true });
      }
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Error al crear cuenta", error: (error as Error).message });
    }
  });

  app.get("/api/accounts/:accountId/transactions", async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const transactions = await storage.getAccountTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener transacciones", error: (error as Error).message });
    }
  });

  app.post("/api/account-transactions", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const { accountId, amount, type, description } = req.body;
      
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Cuenta no encontrada" });
      }
      
      // Calculate new balance
      let newBalance = parseFloat(account.balance.toString());
      if (type === "credit") {
        newBalance += parseFloat(amount);
      } else if (type === "debit") {
        newBalance -= parseFloat(amount);
      }
      
      // Create transaction
      const transaction = await storage.createAccountTransaction({
        accountId,
        amount,
        type,
        description,
        userId: req.user.id,
        balanceAfter: newBalance
      });
      
      // Update account balance
      await storage.updateAccount(accountId, { balance: newBalance, lastUpdated: new Date() });
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Error al crear transacción", error: (error as Error).message });
    }
  });

  // Sales endpoints
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener ventas", error: (error as Error).message });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const { customerId, total, paymentMethod, status, items } = req.body;
      
      // Create sale
      const sale = await storage.createSale({
        customerId,
        userId: req.user.id,
        total,
        paymentMethod,
        status,
        timestamp: new Date()
      });
      
      // Create sale items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createSaleItem({
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            discount: item.discount || 0,
            total: item.total
          });
          
          // Update product stock
          const product = await storage.getProduct(item.productId);
          if (product) {
            const newStock = parseFloat(product.stock.toString()) - parseFloat(item.quantity);
            await storage.updateProduct(item.productId, { stock: newStock });
          }
        }
      }
      
      // If paying with account, create account transaction
      if (paymentMethod === "account" && customerId) {
        const customer = await storage.getCustomer(customerId);
        if (customer && customer.hasAccount) {
          const account = await storage.getAccountByCustomerId(customerId);
          if (account) {
            const newBalance = parseFloat(account.balance.toString()) - parseFloat(total);
            
            await storage.createAccountTransaction({
              accountId: account.id,
              amount: total,
              type: "debit",
              description: `Venta #${sale.id}`,
              relatedSaleId: sale.id,
              userId: req.user.id
            });
            
            await storage.updateAccount(account.id, { balance: newBalance, lastUpdated: new Date() });
          }
        }
      }
      
      res.status(201).json(sale);
    } catch (error) {
      res.status(400).json({ message: "Error al crear venta", error: (error as Error).message });
    }
  });

  // Invoices (remitos) endpoints
  app.get("/api/invoices", async (req, res) => {
    try {
      // For this MVP, invoices will be the same as sales
      const sales = await storage.getAllSales();
      
      // Enrich with customer data
      const invoices = await Promise.all(
        sales.map(async (sale) => {
          let customer = null;
          if (sale.customerId) {
            customer = await storage.getCustomer(sale.customerId);
          }
          
          const user = await storage.getUser(sale.userId);
          
          // Get sale items
          const items = await storage.getSaleItemsBySaleId(sale.id);
          
          return {
            ...sale,
            customer,
            user,
            items
          };
        })
      );
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener remitos", error: (error as Error).message });
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      
      // Enrich with customer data
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          let customer = null;
          if (order.customerId) {
            customer = await storage.getCustomer(order.customerId);
          }
          
          const user = await storage.getUser(order.userId);
          
          // Get order items
          const items = await storage.getOrderItemsByOrderId(order.id);
          
          return {
            ...order,
            customer,
            user,
            items
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedidos", error: (error as Error).message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const { customerId, total, status, notes, deliveryDate, items } = req.body;
      
      // Create order
      const order = await storage.createOrder({
        customerId,
        userId: req.user.id,
        total,
        status,
        notes,
        deliveryDate,
        timestamp: new Date()
      });
      
      // Create order items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: item.total
          });
        }
      }
      
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Error al crear pedido", error: (error as Error).message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const orderSchema = z.object({
        status: z.enum(["pending", "processing", "completed"])
      });
      
      const validatedData = orderSchema.parse({ status });
      
      const order = await storage.updateOrder(id, { status: validatedData.status });
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar estado del pedido", error: (error as Error).message });
    }
  });

  // Notes (credit/debit) endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getAllNotes();
      
      // Enrich with customer and user data
      const enrichedNotes = await Promise.all(
        notes.map(async (note) => {
          let customer = null;
          if (note.customerId) {
            customer = await storage.getCustomer(note.customerId);
          }
          
          const user = await storage.getUser(note.userId);
          
          return {
            ...note,
            customer,
            user
          };
        })
      );
      
      res.json(enrichedNotes);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener notas", error: (error as Error).message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const { customerId, type, relatedSaleId, amount, reason, notes } = req.body;
      
      // Create note
      const note = await storage.createNote({
        customerId,
        userId: req.user.id,
        type,
        relatedSaleId,
        amount,
        reason,
        notes,
        timestamp: new Date()
      });
      
      // If the customer has an account, create a transaction
      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (customer && customer.hasAccount) {
          const account = await storage.getAccountByCustomerId(customerId);
          if (account) {
            let newBalance = parseFloat(account.balance.toString());
            
            if (type === "credit") {
              newBalance += parseFloat(amount);
            } else if (type === "debit") {
              newBalance -= parseFloat(amount);
            }
            
            await storage.createAccountTransaction({
              accountId: account.id,
              amount,
              type: type === "credit" ? "credit" : "debit",
              description: `Nota de ${type === "credit" ? "crédito" : "débito"} #${note.id}: ${reason}`,
              relatedNoteId: note.id,
              userId: req.user.id
            });
            
            await storage.updateAccount(account.id, { balance: newBalance, lastUpdated: new Date() });
          }
        }
      }
      
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ message: "Error al crear nota", error: (error as Error).message });
    }
  });

  // Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const users = await storage.getAllUsers();
      // Remove password field
      const safeUsers = users.map(({ password, ...user }) => user);
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
