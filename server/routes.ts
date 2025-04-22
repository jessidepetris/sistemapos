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
      
      const { 
        customerId, 
        total, 
        paymentMethod, 
        paymentDetails,
        documentType,
        notes,
        printOptions,
        status, 
        items 
      } = req.body;
      
      // Crear número de factura si es necesario
      let invoiceNumber = null;
      if (documentType && documentType.startsWith('factura')) {
        // En una implementación real, aquí se conectaría con AFIP
        // para generar el número real de factura electrónica
        // Por ahora generamos uno de prueba con formato: A-00001-00000001
        const tipoFactura = documentType === 'factura_a' ? 'A' : 'B';
        const puntoVenta = '00001';
        const numero = Math.floor(Math.random() * 1000000).toString().padStart(8, '0');
        invoiceNumber = `${tipoFactura}-${puntoVenta}-${numero}`;
      }
      
      // Create sale
      const sale = await storage.createSale({
        customerId,
        userId: req.user.id,
        total,
        paymentMethod,
        paymentDetails,
        documentType: documentType || 'remito',
        invoiceNumber,
        status,
        notes,
        printOptions
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
            total: item.total,
            isConversion: item.isConversion || false,
            conversionFactor: item.conversionFactor || 1,
            conversionUnit: item.conversionUnit || null,
            conversionBarcode: item.conversionBarcode || null
          });
          
          // Update product stock
          const product = await storage.getProduct(item.productId);
          if (product) {
            // Si el item tiene información de conversión, aplicamos el factor
            if (item.isConversion && item.conversionFactor) {
              // Descontamos proporcionalmente según el factor de conversión
              // Por ejemplo, si vendemos una presentación de 500g (factor 0.5) con cantidad 2,
              // descontamos 2 * 0.5 = 1kg del stock principal
              const stockToDeduct = parseFloat(item.quantity) * parseFloat(item.conversionFactor.toString());
              const newStock = parseFloat(product.stock.toString()) - stockToDeduct;
              await storage.updateProduct(item.productId, { stock: newStock });
              
              console.log(`Venta de conversión: Producto ${product.name}, Presentación: ${item.unit}, 
                           Cantidad: ${item.quantity}, Factor: ${item.conversionFactor}, 
                           Stock descontado: ${stockToDeduct} ${product.baseUnit}`);
            } else {
              // Descuento normal para productos estándar
              const newStock = parseFloat(product.stock.toString()) - parseFloat(item.quantity);
              await storage.updateProduct(item.productId, { stock: newStock });
            }
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
          
          // Parse payment details if exists
          let paymentDetailsObj = null;
          if (sale.paymentDetails) {
            try {
              paymentDetailsObj = JSON.parse(sale.paymentDetails);
            } catch (e) {
              console.error("Error parsing payment details", e);
            }
          }
          
          // Parse print options if exists
          let printOptionsObj = sale.printOptions || { printTicket: true, sendEmail: false };
          
          return {
            ...sale,
            customer,
            user,
            items,
            paymentDetailsObj,
            printOptionsObj,
            // Información adicional para la impresión del comprobante
            businessName: "Punto Pastelero",
            businessAddress: "Av. Colón 1234, Córdoba, Argentina",
            businessPhone: "+54 351 123-4567",
            businessEmail: "ventas@puntopastelero.com",
            // Tipo de factura según documentType para impresión
            invoiceType: sale.documentType === 'factura_a' ? 'A' : 
                        sale.documentType === 'factura_b' ? 'B' : 'R'
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

  // ======= ENDPOINTS DE LOGÍSTICA ======= //

  // Vehículos
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener vehículos", error: (error as Error).message });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicle = await storage.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Error al crear vehículo", error: (error as Error).message });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.updateVehicle(id, req.body);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar vehículo", error: (error as Error).message });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar vehículo", error: (error as Error).message });
    }
  });

  // Zonas de entrega
  app.get("/api/delivery-zones", async (req, res) => {
    try {
      const zones = await storage.getAllDeliveryZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener zonas de entrega", error: (error as Error).message });
    }
  });

  app.post("/api/delivery-zones", async (req, res) => {
    try {
      const zone = await storage.createDeliveryZone(req.body);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ message: "Error al crear zona de entrega", error: (error as Error).message });
    }
  });

  app.put("/api/delivery-zones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const zone = await storage.updateDeliveryZone(id, req.body);
      res.json(zone);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar zona de entrega", error: (error as Error).message });
    }
  });

  app.delete("/api/delivery-zones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryZone(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar zona de entrega", error: (error as Error).message });
    }
  });

  // Rutas de entrega
  app.get("/api/delivery-routes", async (req, res) => {
    try {
      const routes = await storage.getAllDeliveryRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener rutas de entrega", error: (error as Error).message });
    }
  });

  app.get("/api/delivery-routes/by-zone/:zoneId", async (req, res) => {
    try {
      const zoneId = parseInt(req.params.zoneId);
      const routes = await storage.getDeliveryRoutesByZone(zoneId);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener rutas de entrega", error: (error as Error).message });
    }
  });

  app.post("/api/delivery-routes", async (req, res) => {
    try {
      const route = await storage.createDeliveryRoute(req.body);
      res.status(201).json(route);
    } catch (error) {
      res.status(400).json({ message: "Error al crear ruta de entrega", error: (error as Error).message });
    }
  });

  app.put("/api/delivery-routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.updateDeliveryRoute(id, req.body);
      res.json(route);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar ruta de entrega", error: (error as Error).message });
    }
  });

  app.delete("/api/delivery-routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliveryRoute(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar ruta de entrega", error: (error as Error).message });
    }
  });

  // Entregas
  app.get("/api/deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries();
      
      // Enriquecemos la respuesta con información de clientes y rutas
      const enrichedDeliveries = await Promise.all(
        deliveries.map(async (delivery) => {
          let customer = null;
          if (delivery.customerId) {
            customer = await storage.getCustomer(delivery.customerId);
          }
          
          let route = null;
          if (delivery.routeId) {
            route = await storage.getDeliveryRoute(delivery.routeId);
          }
          
          let driver = null;
          if (delivery.driverId) {
            const driverData = await storage.getUser(delivery.driverId);
            if (driverData) {
              // No incluimos la contraseña
              const { password, ...safeDriver } = driverData;
              driver = safeDriver;
            }
          }
          
          let vehicle = null;
          if (delivery.vehicleId) {
            vehicle = await storage.getVehicle(delivery.vehicleId);
          }
          
          const events = await storage.getDeliveryEventsByDelivery(delivery.id);
          
          return {
            ...delivery,
            customer,
            route,
            driver,
            vehicle,
            events
          };
        })
      );
      
      res.json(enrichedDeliveries);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener entregas", error: (error as Error).message });
    }
  });

  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Entrega no encontrada" });
      }
      
      // Enriquecemos la respuesta con información de clientes y rutas
      let customer = null;
      if (delivery.customerId) {
        customer = await storage.getCustomer(delivery.customerId);
      }
      
      let route = null;
      if (delivery.routeId) {
        route = await storage.getDeliveryRoute(delivery.routeId);
      }
      
      let driver = null;
      if (delivery.driverId) {
        const driverData = await storage.getUser(delivery.driverId);
        if (driverData) {
          // No incluimos la contraseña
          const { password, ...safeDriver } = driverData;
          driver = safeDriver;
        }
      }
      
      let vehicle = null;
      if (delivery.vehicleId) {
        vehicle = await storage.getVehicle(delivery.vehicleId);
      }
      
      const events = await storage.getDeliveryEventsByDelivery(delivery.id);
      
      const enrichedDelivery = {
        ...delivery,
        customer,
        route,
        driver,
        vehicle,
        events
      };
      
      res.json(enrichedDelivery);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener entrega", error: (error as Error).message });
    }
  });

  app.get("/api/deliveries/by-status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const deliveries = await storage.getDeliveriesByStatus(status);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener entregas por estado", error: (error as Error).message });
    }
  });

  app.get("/api/deliveries/by-driver/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const deliveries = await storage.getDeliveriesByDriver(driverId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener entregas por conductor", error: (error as Error).message });
    }
  });

  app.get("/api/deliveries/by-customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const deliveries = await storage.getDeliveriesByCustomer(customerId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener entregas por cliente", error: (error as Error).message });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      // Incluimos el usuario que crea la entrega
      const delivery = await storage.createDelivery({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Error al crear entrega", error: (error as Error).message });
    }
  });

  app.put("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const delivery = await storage.updateDelivery(id, req.body);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar entrega", error: (error as Error).message });
    }
  });

  app.post("/api/deliveries/:id/status", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Se requiere el status" });
      }
      
      const delivery = await storage.updateDeliveryStatus(id, status, req.user.id);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar estado de entrega", error: (error as Error).message });
    }
  });

  app.delete("/api/deliveries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDelivery(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar entrega", error: (error as Error).message });
    }
  });

  // Eventos de entrega
  app.get("/api/delivery-events/by-delivery/:deliveryId", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const events = await storage.getDeliveryEventsByDelivery(deliveryId);
      
      // Enriquecemos con información del usuario
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          let user = null;
          if (event.userId) {
            const userData = await storage.getUser(event.userId);
            if (userData) {
              // No incluimos la contraseña
              const { password, ...safeUser } = userData;
              user = safeUser;
            }
          }
          
          return {
            ...event,
            user
          };
        })
      );
      
      res.json(enrichedEvents);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener eventos de entrega", error: (error as Error).message });
    }
  });

  app.post("/api/delivery-events", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      // Incluimos el usuario que crea el evento
      const event = await storage.createDeliveryEvent({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Error al crear evento de entrega", error: (error as Error).message });
    }
  });

  // Asignaciones de rutas
  app.get("/api/route-assignments", async (req, res) => {
    try {
      const dateParam = req.query.date as string;
      let assignments;
      
      if (dateParam) {
        const date = new Date(dateParam);
        assignments = await storage.getRouteAssignmentsByDate(date);
      } else {
        // Sin fecha, usamos la fecha actual
        assignments = await storage.getRouteAssignmentsByDate(new Date());
      }
      
      // Enriquecemos con información de rutas, vehículos y conductores
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const route = await storage.getDeliveryRoute(assignment.routeId);
          
          let driver = null;
          const driverData = await storage.getUser(assignment.driverId);
          if (driverData) {
            // No incluimos la contraseña
            const { password, ...safeDriver } = driverData;
            driver = safeDriver;
          }
          
          const vehicle = await storage.getVehicle(assignment.vehicleId);
          
          return {
            ...assignment,
            route,
            driver,
            vehicle
          };
        })
      );
      
      res.json(enrichedAssignments);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener asignaciones de rutas", error: (error as Error).message });
    }
  });

  app.get("/api/route-assignments/by-driver/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const assignments = await storage.getRouteAssignmentsByDriver(driverId);
      
      // Enriquecemos con información de rutas y vehículos
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const route = await storage.getDeliveryRoute(assignment.routeId);
          const vehicle = await storage.getVehicle(assignment.vehicleId);
          
          return {
            ...assignment,
            route,
            vehicle
          };
        })
      );
      
      res.json(enrichedAssignments);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener asignaciones por conductor", error: (error as Error).message });
    }
  });

  app.post("/api/route-assignments", async (req, res) => {
    try {
      const assignment = await storage.createRouteAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Error al crear asignación de ruta", error: (error as Error).message });
    }
  });

  app.put("/api/route-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.updateRouteAssignment(id, req.body);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar asignación de ruta", error: (error as Error).message });
    }
  });

  app.delete("/api/route-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRouteAssignment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar asignación de ruta", error: (error as Error).message });
    }
  });

  // Rutas para el Catálogo Web
  
  // Autenticación de usuarios web
  app.post("/api/web/register", async (req, res) => {
    try {
      const { email, password, name, address, phone, city, province } = req.body;
      
      // Verificar si el usuario ya existe
      const existingUsers = await storage.getAllWebUsers();
      const existingUser = existingUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }
      
      // Crear un cliente primero
      const customer = await storage.createCustomer({
        name,
        address,
        phone,
        email,
        city,
        province,
        hasAccount: false
      });
      
      // Crear usuario web
      // En un sistema real, deberíamos encriptar la contraseña y generar un token de verificación
      const webUser = await storage.createWebUser({
        email,
        password, // En un sistema real, esto debería estar hasheado
        customerId: customer.id,
        verificationToken: Math.random().toString(36).substring(2, 15),
        verified: false
      });
      
      res.status(201).json({
        id: webUser.id,
        email: webUser.email,
        customerId: webUser.customerId,
        verified: webUser.verified
      });
    } catch (error) {
      res.status(400).json({ message: "Error al registrar usuario", error: (error as Error).message });
    }
  });
  
  app.post("/api/web/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Buscar usuario por email
      const webUsers = await storage.getAllWebUsers();
      const webUser = webUsers.find(u => u.email === email);
      
      if (!webUser || webUser.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // Actualizar el último login
      await storage.updateWebUser(webUser.id, { lastLogin: new Date() });
      
      // Obtener información del cliente asociado
      let customer = null;
      if (webUser.customerId) {
        customer = await storage.getCustomer(webUser.customerId);
      }
      
      // Crear sesión web (en una implementación real usaríamos JWT o similar)
      const sessionToken = Math.random().toString(36).substring(2, 15);
      
      res.json({
        id: webUser.id,
        email: webUser.email,
        customerId: webUser.customerId,
        verified: webUser.verified,
        customer,
        token: sessionToken
      });
    } catch (error) {
      res.status(500).json({ message: "Error al iniciar sesión", error: (error as Error).message });
    }
  });
  
  // Productos para catálogo
  app.get("/api/web/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Filtrar productos para mostrar en el catálogo
      // Solo devolver productos que estén marcados como visibles en web, con stock > 0 y activos
      const catalogProducts = products
        .filter(p => {
          // Si el producto no está activo o no está marcado para mostrar en web, no lo incluimos
          if (!p.active || !p.webVisible) return false;
          
          // Solo incluir productos con stock, a menos que se solicite mostrar los agotados
          return parseFloat(p.stock.toString()) > 0 || req.query.showOutOfStock === 'true';
        })
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          category: p.category,
          inStock: parseFloat(p.stock.toString()) > 0,
          isRefrigerated: p.isRefrigerated,
          baseUnit: p.baseUnit,
          conversionRates: p.conversionRates
        }));
      
      res.json(catalogProducts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener productos", error: (error as Error).message });
    }
  });
  
  // Categorías para catálogo
  app.get("/api/web/categories", async (req, res) => {
    try {
      const allProducts = await storage.getAllProducts();
      
      // Extraer categorías únicas de los productos activos y visibles en la web
      const categories = Array.from(
        new Set(
          allProducts
            .filter(product => product.active && product.webVisible)
            .map(product => product.category)
            .filter(Boolean) // Eliminar categorías null o undefined
        )
      ).map((categoryName, index) => ({
        id: index + 1,
        name: categoryName
      }));
      
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener categorías", error: (error as Error).message });
    }
  });
  
  // Carrito de compra
  // Obtener el carrito actual o crear uno nuevo si no existe
  app.get("/api/web/cart", async (req, res) => {
    try {
      // Obtener sessionId desde cookie o generar uno nuevo
      let sessionId = req.cookies?.cart_session_id;
      
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        res.cookie('cart_session_id', sessionId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: true,
          sameSite: 'strict'
        });
      }
      
      // Buscar un carrito existente para esta sesión con estado active
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      let cart = existingCarts.find(c => c.status === 'active');
      
      // Si no existe un carrito activo, crear uno nuevo
      if (!cart) {
        let webUserId = null;
        
        // Si el usuario está autenticado, asociar el carrito con su cuenta
        if (req.isAuthenticated() && req.user.webUserId) {
          webUserId = req.user.webUserId;
        }
        
        cart = await storage.createCart({
          webUserId,
          sessionId,
          status: 'active'
        });
      }
      
      // Obtener los items del carrito
      const cartItems = await storage.getCartItemsByCartId(cart.id);
      
      // Enriquecer con información de productos
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      // Calcular totales
      const totalItems = cartItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0);
      
      // Responder con el carrito completo
      res.json({
        ...cart,
        items: enrichedItems,
        itemCount: totalItems,
        totalAmount
      });
      
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      res.status(500).json({ message: "Error al obtener carrito", error: (error as Error).message });
    }
  });

  app.post("/api/web/carts", async (req, res) => {
    try {
      const { webUserId, sessionId } = req.body;
      
      const cart = await storage.createCart({
        webUserId,
        sessionId,
        status: 'active'
      });
      
      res.status(201).json(cart);
    } catch (error) {
      res.status(400).json({ message: "Error al crear carrito", error: (error as Error).message });
    }
  });
  
  app.get("/api/web/carts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cart = await storage.getCart(id);
      
      if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
      }
      
      // Obtener items del carrito
      const cartItems = await storage.getCartItemsByCartId(id);
      
      // Enriquecer con información de productos
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json({
        ...cart,
        items: enrichedItems
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener carrito", error: (error as Error).message });
    }
  });
  
  app.post("/api/web/cart/items", async (req, res) => {
    try {
      const { productId, quantity, unit, notes } = req.body;
      
      // Obtener sessionId desde cookie
      let sessionId = req.cookies?.cart_session_id;
      
      if (!sessionId) {
        return res.status(400).json({ message: "No hay una sesión de carrito activa" });
      }
      
      // Buscar un carrito existente para esta sesión
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      let cart = existingCarts.find(c => c.status === 'active');
      
      // Si no existe un carrito activo, crear uno nuevo
      if (!cart) {
        let webUserId = null;
        
        // Si el usuario está autenticado, asociar el carrito con su cuenta
        if (req.isAuthenticated() && req.user.webUserId) {
          webUserId = req.user.webUserId;
        }
        
        cart = await storage.createCart({
          webUserId,
          sessionId,
          status: 'active'
        });
      }
      
      const cartId = cart.id;
      
      // Verificar que el producto existe y tiene stock
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      // Verificar stock disponible
      let stockToCheck = parseFloat(product.stock.toString());
      let quantityToDeduct = parseFloat(quantity);
      
      // Si es una presentación específica (unidad diferente a la base), aplicar conversión
      if (unit !== product.baseUnit && product.conversionRates) {
        const conversions = product.conversionRates as any;
        if (conversions && conversions[unit]) {
          const conversionFactor = parseFloat(conversions[unit].factor);
          quantityToDeduct = quantityToDeduct * conversionFactor;
        }
      }
      
      if (quantityToDeduct > stockToCheck) {
        return res.status(400).json({ message: "No hay suficiente stock disponible" });
      }
      
      // Obtener el precio
      let price = parseFloat(product.price.toString());
      
      // Si es una presentación específica, usar el precio de la presentación
      if (unit !== product.baseUnit && product.conversionRates) {
        const conversions = product.conversionRates as any;
        if (conversions && conversions[unit] && conversions[unit].price) {
          price = parseFloat(conversions[unit].price);
        }
      }
      
      // Calcular total
      const total = price * parseFloat(quantity);
      
      // Crear item en el carrito
      const cartItem = await storage.createCartItem({
        cartId,
        productId,
        quantity,
        unit,
        price: price.toString(),
        notes
      });
      
      // Actualizar el total del carrito
      const allCartItems = await storage.getCartItemsByCartId(cartId);
      const cartTotal = allCartItems.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity), 0);
      const cartTotalItems = allCartItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      
      await storage.updateCart(cartId, {
        totalAmount: cartTotal.toString(),
        totalItems: cartTotalItems,
        updatedAt: new Date()
      });
      
      res.status(201).json({
        ...cartItem,
        product
      });
    } catch (error) {
      res.status(400).json({ message: "Error al agregar item al carrito", error: (error as Error).message });
    }
  });
  
  app.delete("/api/web/cart/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(id);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Item no encontrado" });
      }
      
      // Eliminar item
      await storage.deleteCartItem(id);
      
      // Actualizar el total del carrito
      const allCartItems = await storage.getCartItemsByCartId(cartItem.cartId);
      const cartTotal = allCartItems.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity), 0);
      const cartTotalItems = allCartItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      
      await storage.updateCart(cartItem.cartId, {
        totalAmount: cartTotal.toString(),
        totalItems: cartTotalItems,
        updatedAt: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar item del carrito", error: (error as Error).message });
    }
  });
  
  // Checkout y creación de orden
  app.post("/api/web/orders", async (req, res) => {
    try {
      const { 
        cartId, 
        webUserId, 
        shippingAddress, 
        billingAddress, 
        paymentMethod,
        notes 
      } = req.body;
      
      // Verificar que el carrito existe
      const cart = await storage.getCart(cartId);
      if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
      }
      
      // Verificar que el usuario web existe
      const webUser = await storage.getWebUser(webUserId);
      if (!webUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Obtener items del carrito
      const cartItems = await storage.getCartItemsByCartId(cartId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "El carrito está vacío" });
      }
      
      // Crear la orden en el sistema principal
      // En un sistema real, aquí veríamos cómo manejar el usuario del sistema
      // que está vinculado a las órdenes web
      // Por ahora, usamos un ID de usuario fijo (administrador)
      const adminUsers = await storage.getAllUsers();
      const adminUser = adminUsers.find(u => u.role === "admin") || adminUsers[0];
      
      if (!adminUser) {
        return res.status(500).json({ message: "No se encontró un usuario administrador para procesar la orden" });
      }
      
      // Calcular el total
      const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity), 0);
      
      // Crear la orden
      const order = await storage.createOrder({
        customerId: webUser.customerId,
        userId: adminUser.id,
        total: total.toString(),
        status: "pending",
        notes,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // entrega al día siguiente
        isWebOrder: true,
        source: "web"
      });
      
      // Crear items de la orden
      for (const item of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: (parseFloat(item.price) * parseFloat(item.quantity)).toString()
        });
        
        // Actualizar stock (lo haremos cuando se confirme la orden)
        // const product = await storage.getProduct(item.productId);
        // if (product) {
        //   const newStock = parseFloat(product.stock.toString()) - parseFloat(item.quantity);
        //   await storage.updateProduct(item.productId, { stock: newStock.toString() });
        // }
      }
      
      // Crear la orden web (detalles adicionales)
      const webOrder = await storage.createWebOrder({
        orderId: order.id,
        webUserId,
        cartId,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: "pending",
        notes,
        trackingCode: Math.random().toString(36).substring(2, 10).toUpperCase()
      });
      
      // Marcar el carrito como convertido
      await storage.updateCart(cartId, {
        status: "converted",
        updatedAt: new Date()
      });
      
      res.status(201).json({
        order,
        webOrder,
        trackingUrl: `/web/tracking?code=${webOrder.trackingCode}`
      });
    } catch (error) {
      res.status(400).json({ message: "Error al crear orden", error: (error as Error).message });
    }
  });
  
  // Seguimiento de pedido
  app.get("/api/web/tracking/:code", async (req, res) => {
    try {
      const code = req.params.code;
      
      // Buscar la orden web por código de seguimiento
      const webOrders = await storage.getAllWebOrders();
      const webOrder = webOrders.find(o => o.trackingCode === code);
      
      if (!webOrder) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      
      // Obtener la orden principal
      const order = await storage.getOrder(webOrder.orderId);
      if (!order) {
        return res.status(404).json({ message: "Orden principal no encontrada" });
      }
      
      // Obtener los items de la orden
      const orderItems = await storage.getOrderItemsByOrderId(order.id);
      
      // Obtener información del cliente
      let customer = null;
      if (order.customerId) {
        customer = await storage.getCustomer(order.customerId);
      }
      
      // Obtener información de entrega si existe
      const deliveries = await storage.getAllDeliveries();
      const delivery = deliveries.find(d => d.orderId === order.id);
      
      let deliveryStatus = null;
      let estimatedDelivery = null;
      
      if (delivery) {
        deliveryStatus = delivery.status;
        estimatedDelivery = delivery.estimatedDeliveryTime;
        
        // Obtener eventos de entrega
        const events = await storage.getDeliveryEventsByDelivery(delivery.id);
        delivery.events = events;
      }
      
      res.json({
        trackingCode: webOrder.trackingCode,
        status: order.status,
        orderDate: order.timestamp,
        deliveryDate: order.deliveryDate,
        total: order.total,
        items: orderItems,
        customer,
        shippingAddress: webOrder.shippingAddress,
        paymentMethod: webOrder.paymentMethod,
        paymentStatus: webOrder.paymentStatus,
        delivery: delivery ? {
          status: deliveryStatus,
          estimatedDelivery,
          events: delivery.events
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener información de seguimiento", error: (error as Error).message });
    }
  });
  
  // Configuración del catálogo
  // Vaciar carrito
  app.delete("/api/web/cart", async (req, res) => {
    try {
      // Obtener sessionId desde cookie
      let sessionId = req.cookies?.cart_session_id;
      
      if (!sessionId) {
        return res.status(400).json({ message: "No hay una sesión de carrito activa" });
      }
      
      // Buscar un carrito existente para esta sesión
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      let cart = existingCarts.find(c => c.status === 'active');
      
      if (!cart) {
        return res.status(404).json({ message: "No se encontró un carrito activo" });
      }
      
      // Obtener los items del carrito
      const cartItems = await storage.getCartItemsByCartId(cart.id);
      
      // Eliminar todos los items
      for (const item of cartItems) {
        await storage.deleteCartItem(item.id);
      }
      
      // Actualizar el carrito
      await storage.updateCart(cart.id, {
        totalAmount: "0",
        totalItems: 0,
        updatedAt: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al vaciar el carrito", error: (error as Error).message });
    }
  });
  
  app.get("/api/web/catalog-settings", async (req, res) => {
    try {
      const settings = await storage.getCatalogSettings();
      res.json(settings || {
        storeName: "Punto Pastelero",
        storeDescription: "La mejor pastelería de la ciudad",
        primaryColor: "#3498db",
        secondaryColor: "#2ecc71",
        showOutOfStock: true,
        orderMinimum: "500",
        deliveryFee: "200"
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener configuración", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
