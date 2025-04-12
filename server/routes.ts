import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertCustomerSchema, 
  insertSupplierSchema,
  insertSaleSchema,
  insertSaleDetailSchema,
  insertOrderSchema,
  insertOrderDetailSchema,
  insertNoteSchema
} from "@shared/schema";

// Helper function to ensure authenticated
function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "No autorizado" });
}

// Helper function to ensure admin role
function ensureAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Acceso denegado" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);
  
  // Categories API routes
  app.get("/api/categories", ensureAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });
  
  app.post("/api/categories", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear categoría" });
    }
  });
  
  app.put("/api/categories/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar categoría" });
    }
  });
  
  // Products API routes
  app.get("/api/products", ensureAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });
  
  app.get("/api/products/low-stock", ensureAuthenticated, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener productos con bajo stock" });
    }
  });
  
  app.get("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });
  
  app.post("/api/products", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear producto" });
    }
  });
  
  app.put("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar producto" });
    }
  });
  
  app.delete("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });
  
  app.post("/api/products/update-prices", ensureAuthenticated, async (req, res) => {
    try {
      const data = z.object({
        supplierId: z.number(),
        percentage: z.number()
      }).parse(req.body);
      
      const updatedCount = await storage.updateProductsPrice(data.supplierId, data.percentage);
      res.json({ message: `${updatedCount} productos actualizados exitosamente` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar precios" });
    }
  });
  
  // Customers API routes
  app.get("/api/customers", ensureAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes" });
    }
  });
  
  app.get("/api/customers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cliente" });
    }
  });
  
  app.post("/api/customers", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear cliente" });
    }
  });
  
  app.put("/api/customers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      
      if (!customer) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar cliente" });
    }
  });
  
  // Suppliers API routes
  app.get("/api/suppliers", ensureAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedores" });
    }
  });
  
  app.get("/api/suppliers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener proveedor" });
    }
  });
  
  app.post("/api/suppliers", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear proveedor" });
    }
  });
  
  app.put("/api/suppliers/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData);
      
      if (!supplier) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }
      
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar proveedor" });
    }
  });
  
  // Sales API routes
  app.get("/api/sales/recent", ensureAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || "5");
      const sales = await storage.getRecentSales(limit);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener ventas recientes" });
    }
  });
  
  app.get("/api/sales/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSaleWithDetails(id);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener venta" });
    }
  });
  
  app.post("/api/sales", ensureAuthenticated, async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body.sale);
      const detailsData = z.array(insertSaleDetailSchema).parse(req.body.details);
      
      // Set current user ID
      saleData.userId = req.user?.id;
      
      const sale = await storage.createSale(saleData, detailsData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear venta" });
    }
  });
  
  // Orders API routes
  app.get("/api/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });
  
  app.get("/api/orders/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithDetails(id);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedido" });
    }
  });
  
  app.post("/api/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body.order);
      const detailsData = z.array(insertOrderDetailSchema).parse(req.body.details);
      
      // Set current user ID
      orderData.userId = req.user?.id;
      
      const order = await storage.createOrder(orderData, detailsData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear pedido" });
    }
  });
  
  app.put("/api/orders/:id/status", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = z.string().parse(req.body.status);
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar estado del pedido" });
    }
  });
  
  // Notes API routes (credit/debit)
  app.get("/api/notes", ensureAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getAllNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener notas" });
    }
  });
  
  app.get("/api/notes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Nota no encontrada" });
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener nota" });
    }
  });
  
  app.post("/api/notes", ensureAuthenticated, async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      
      // Set current user ID
      noteData.userId = req.user?.id;
      
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear nota" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
