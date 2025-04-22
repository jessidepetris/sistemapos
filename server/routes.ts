import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Obtener fecha de hoy (inicio y fin)
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Obtener ventas de hoy
      const todaySales = await storage.getAllSales() || [];
      const todaySalesFiltered = todaySales.filter((sale: any) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startOfToday;
      });
      
      const yesterdaySales = await storage.getAllSales() || [];
      const yesterdaySalesFiltered = yesterdaySales.filter((sale: any) => {
        const saleDate = new Date(sale.timestamp);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        return saleDate >= startOfYesterday && saleDate <= endOfYesterday;
      });
      
      // Calcular total de ventas de hoy
      const todayTotal = todaySalesFiltered.reduce((acc: number, sale: any) => {
        return acc + parseFloat(sale.total);
      }, 0);
      
      // Calcular total de ventas de ayer
      const yesterdayTotal = yesterdaySalesFiltered.reduce((acc: number, sale: any) => {
        return acc + parseFloat(sale.total);
      }, 0);
      
      // Calcular cambio porcentual
      let percentChange = 0;
      let trend = "neutral";
      
      if (yesterdayTotal > 0) {
        percentChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
        trend = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral";
      } else if (todayTotal > 0) {
        percentChange = 100;
        trend = "up";
      }
      
      // Obtener productos con stock bajo
      const products = await storage.getAllProducts() || [];
      const lowStockProducts = products.filter((product: any) => {
        // Consideramos stock bajo cuando hay menos de 10 unidades
        return parseFloat(product.stock) < 10;
      });
      
      // Obtener clientes nuevos (últimos 7 días)
      const customers = await storage.getAllCustomers() || [];
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const newCustomers = customers.filter((customer: any) => {
        // Si no hay fecha de registro, no lo consideramos nuevo
        if (!customer.createdAt) return false;
        const registerDate = new Date(customer.createdAt);
        return registerDate >= sevenDaysAgo;
      });
      
      const stats = {
        todaySales: { 
          total: `$${todayTotal.toFixed(2)}`, 
          change: `${Math.abs(percentChange).toFixed(1)}%`, 
          trend 
        },
        transactions: { 
          count: `${todaySalesFiltered.length}`, 
          change: yesterdaySalesFiltered.length > 0 
            ? `${Math.abs(((todaySalesFiltered.length - yesterdaySalesFiltered.length) / yesterdaySalesFiltered.length) * 100).toFixed(1)}%` 
            : "0%", 
          trend: todaySalesFiltered.length > yesterdaySalesFiltered.length ? "up" : 
                 todaySalesFiltered.length < yesterdaySalesFiltered.length ? "down" : "neutral" 
        },
        lowStock: { 
          count: `${lowStockProducts.length}` 
        },
        newCustomers: { 
          count: `${newCustomers.length}` 
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error al generar estadísticas del dashboard:", error);
      res.status(500).json({ error: "Error al generar estadísticas" });
    }
  });

  app.get("/api/dashboard/recent-sales", async (req, res) => {
    try {
      const allSales = await storage.getAllSales() || [];
      
      // Ordenar por fecha, más recientes primero
      const sortedSales = [...allSales].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Tomar las 5 ventas más recientes
      const recentSales = sortedSales.slice(0, 5).map(async (sale) => {
        // Obtener detalles del cliente
        let customerName = "Cliente no registrado";
        if (sale.customerId) {
          const customer = await storage.getCustomer(sale.customerId);
          if (customer) {
            customerName = customer.name;
          }
        }
        
        // Obtener ítems de la venta
        const saleItems = await storage.getSaleItemsBySaleId(sale.id);
        
        return {
          id: sale.id,
          customer: customerName,
          items: saleItems.length,
          total: parseFloat(sale.total),
          timestamp: sale.timestamp,
          status: sale.status || "completed"
        };
      });
      
      // Resolver todas las promesas
      const processedSales = await Promise.all(recentSales);
      
      res.json(processedSales);
    } catch (error) {
      console.error("Error al obtener ventas recientes:", error);
      res.status(500).json({ error: "Error al obtener ventas recientes" });
    }
  });

  app.get("/api/dashboard/inventory-alerts", async (req, res) => {
    try {
      const products = await storage.getAllProducts() || [];
      
      // Filtrar productos con stock bajo
      const lowStockProducts = products
        .filter((product: any) => {
          return parseFloat(product.stock) < 10;
        })
        .map((product: any, index) => {
          return {
            id: product.id,
            product: product.name,
            stock: parseFloat(product.stock),
            unit: product.unit || "unidades",
            level: parseFloat(product.stock) < 5 ? "critical" : "warning"
          };
        });
      
      // Ordenar por nivel de criticidad y stock (primero los más críticos)
      const sortedAlerts = lowStockProducts.sort((a, b) => {
        if (a.level === "critical" && b.level !== "critical") return -1;
        if (a.level !== "critical" && b.level === "critical") return 1;
        return a.stock - b.stock;
      });
      
      // Limitar a 5 alertas
      const inventoryAlerts = sortedAlerts.slice(0, 5);
      
      res.json(inventoryAlerts);
    } catch (error) {
      console.error("Error al obtener alertas de inventario:", error);
      res.status(500).json({ error: "Error al obtener alertas de inventario" });
    }
  });

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      // Recopilar diferentes tipos de actividad
      const allSales = await storage.getAllSales() || [];
      const users = await storage.getAllUsers() || [];
      
      // Crear actividades de venta (las 2 más recientes)
      const salesActivities = allSales
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 2)
        .map((sale, index) => {
          const user = users.find((u: any) => u.id === sale.userId);
          const timeAgo = getTimeAgo(sale.timestamp);
          
          return {
            id: `sale-${sale.id}`,
            user: user ? (user.fullName || user.username) : "Usuario",
            action: `registró una venta de $${parseFloat(sale.total).toFixed(2)}`,
            timeAgo,
            type: "sale",
            timestamp: new Date(sale.timestamp).getTime()
          };
        });
      
      // Actividades de inventario
      const inventoryActivities = [
        {
          id: "inventory-1",
          user: "Sistema",
          action: "actualizó nivel de stock de productos",
          timeAgo: "Hace 2 horas",
          type: "inventory",
          timestamp: Date.now() - 2 * 60 * 60 * 1000
        }
      ];
      
      // Actividades de precios
      const priceActivities = [
        {
          id: "price-1",
          user: users.length > 0 ? (users[0].fullName || users[0].username) : "Usuario",
          action: "actualizó precios de productos",
          timeAgo: "Hace 4 horas",
          type: "price",
          timestamp: Date.now() - 4 * 60 * 60 * 1000
        }
      ];
      
      // Actividades de clientes
      const customerActivities = [
        {
          id: "customer-1",
          user: users.length > 1 ? (users[1].fullName || users[1].username) : "Usuario",
          action: "registró un nuevo cliente",
          timeAgo: "Hace 6 horas",
          type: "customer",
          timestamp: Date.now() - 6 * 60 * 60 * 1000
        }
      ];
      
      // Combinar todas las actividades
      const allActivities = [
        ...salesActivities,
        ...inventoryActivities,
        ...priceActivities,
        ...customerActivities
      ];
      
      // Ordenar por tiempo (más recientes primero)
      const sortedActivities = allActivities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Tomar las 4 actividades más recientes
      const recentActivity = sortedActivities.slice(0, 4);
      
      res.json(recentActivity);
    } catch (error) {
      console.error("Error al obtener actividad reciente:", error);
      res.status(500).json({ error: "Error al obtener actividad reciente" });
    }
  });
  
  // Función helper para calcular tiempo transcurrido
  function getTimeAgo(timestamp: string | Date) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    } else {
      return `Hace ${diffDays} días`;
    }
  }

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
      // Comprobar si el usuario está autenticado
      const userId = req.user?.id || req.body.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "No autorizado: Se requiere usuario para la transacción" });
      }
      
      const { accountId, amount, type, description } = req.body;
      
      console.log("Solicitud de transacción recibida:", { accountId, amount, type, description, userId });
      
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
      
      console.log("Nuevo balance calculado:", newBalance);
      
      // Create transaction
      const transaction = await storage.createAccountTransaction({
        accountId,
        amount,
        type,
        description,
        userId,
        balanceAfter: newBalance
      });
      
      // Update account balance
      await storage.updateAccount(accountId, { balance: newBalance, lastUpdated: new Date() });
      
      console.log("Transacción creada con éxito:", transaction);
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error al crear transacción:", error);
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
            
            // Descripción detallada basada en el tipo de documento
            let docTypeText = "Venta";
            if (documentType === "remito") {
              docTypeText = "Remito";
            } else if (documentType === "factura_c") {
              docTypeText = "Factura C";
            } else if (documentType === "factura_a") {
              docTypeText = "Factura A";
            } else if (documentType === "factura_b") {
              docTypeText = "Factura B";
            }
            
            const docNumber = invoiceNumber || `#${sale.id}`;
            
            await storage.createAccountTransaction({
              accountId: account.id,
              amount: total,
              type: "debit",
              description: `${docTypeText} ${docNumber}`,
              relatedSaleId: sale.id,
              userId: req.user.id,
              balanceAfter: newBalance
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
      
      // Enrich with customer, user, and related sale data
      const enrichedNotes = await Promise.all(
        notes.map(async (note) => {
          let customer = null;
          if (note.customerId) {
            customer = await storage.getCustomer(note.customerId);
          }
          
          const user = await storage.getUser(note.userId);
          
          let relatedSale = null;
          if (note.relatedSaleId) {
            relatedSale = await storage.getSale(note.relatedSaleId);
          }
          
          // Si hay venta relacionada y está asociada a un cliente, obtenemos los datos
          if (relatedSale && relatedSale.customerId) {
            const saleCustomer = await storage.getCustomer(relatedSale.customerId);
            if (saleCustomer) {
              relatedSale.customer = saleCustomer;
            }
          }
          
          // Si hay una cuenta de cliente, verificamos si hay transacción asociada
          let accountTransaction = null;
          if (note.customerId && customer?.hasAccount) {
            const account = await storage.getAccountByCustomerId(note.customerId);
            if (account) {
              // Buscar transacciones que tengan relatedNoteId igual al ID de esta nota
              const transactions = await storage.getAccountTransactions(account.id);
              accountTransaction = transactions.find(t => t.relatedNoteId === note.id);
            }
          }
          
          return {
            ...note,
            customer,
            user: user ? { ...user, password: undefined } : null,
            relatedSale,
            accountTransaction
          };
        })
      );
      
      res.json(enrichedNotes);
    } catch (error) {
      console.error("Error al obtener notas:", error);
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
      
      let accountTransaction = null;
      
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
            
            // Crear transacción en cuenta corriente
            accountTransaction = await storage.createAccountTransaction({
              accountId: account.id,
              amount,
              type: type === "credit" ? "credit" : "debit",
              description: `Nota de ${type === "credit" ? "crédito" : "débito"} #${note.id}: ${reason}`,
              relatedNoteId: note.id,
              userId: req.user.id
            });
            
            // Actualizar saldo en cuenta
            await storage.updateAccount(account.id, { 
              balance: newBalance.toString(), 
              lastUpdated: new Date() 
            });
            
            // Enriquecer la nota con información del cliente
            note.customer = customer;
          }
        }
      }
      
      // Devolver nota y la transacción si se creó
      res.status(201).json({
        ...note,
        accountTransaction
      });
    } catch (error) {
      console.error("Error al crear nota:", error);
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
      const { username, password, fullName, email, phone, address, customerId } = req.body;
      
      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya está registrado" });
      }
      
      // Si no se proporciona un customerId, crear un nuevo cliente
      let customerAssociated = customerId;
      if (!customerAssociated) {
        const customer = await storage.createCustomer({
          name: fullName,
          address,
          phone,
          email,
          province: "",
          city: "",
          hasAccount: false
        });
        customerAssociated = customer.id;
      }
      
      // Importamos la función de hashPassword de auth.ts para hashear la contraseña
      // Usando la función hashPassword que ya está importada en la parte superior
      const hashedPassword = await hashPassword(password);
      
      // Crear usuario web (reutilizamos la tabla de usuarios)
      const webUser = await storage.createUser({
        username,
        password: hashedPassword, // Ahora sí está hasheado correctamente
        fullName,
        role: "cliente", // Rol específico para usuarios web
        active: true
      });
      
      res.status(201).json({
        id: webUser.id,
        username: webUser.username,
        fullName: webUser.fullName,
        customerId: customerAssociated
      });
    } catch (error) {
      res.status(400).json({ message: "Error al registrar usuario", error: (error as Error).message });
    }
  });
  
  app.post("/api/web/login", (req, res, next) => {
    // Usar el mismo mecanismo de autenticación que /api/login
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Error al iniciar sesión", error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // Verificar que sea un usuario cliente
      if (user.role !== 'cliente') {
        return res.status(403).json({ message: "Acceso denegado. Usuario no autorizado para el catálogo web" });
      }

      // Iniciar sesión con Passport
      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al iniciar sesión", error: err.message });
        }
        
        try {
          // Buscar cliente asociado por nombre completo (simplificado, en producción se usaría relación directa)
          const allCustomers = await storage.getAllCustomers();
          const customer = allCustomers.find(c => c.name === user.fullName);
          
          let customerId = null;
          if (customer) {
            customerId = customer.id;
          }
          
          // Responder con los datos del usuario
          res.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            customerId
          });
        } catch (error) {
          res.status(500).json({ message: "Error al iniciar sesión", error: (error as Error).message });
        }
      });
    })(req, res, next);
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
  // Obtener un producto específico por ID
  app.get("/api/web/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      // Verificamos si el producto es visible en el catálogo
      if (!product.active || !product.webVisible) {
        return res.status(404).json({ message: "Producto no disponible" });
      }
      
      // Devolvemos los detalles del producto para el catálogo
      res.json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        inStock: parseFloat(product.stock.toString()) > 0,
        isRefrigerated: product.isRefrigerated,
        baseUnit: product.baseUnit,
        conversionRates: product.conversionRates
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener producto", error: (error as Error).message });
    }
  });
  
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
      console.log("TODAS LAS COOKIES:", req.cookies);
      
      // Obtener sessionId desde cookie o generar uno nuevo
      let sessionId = req.cookies?.cart_session_id;
      
      if (!sessionId) {
        // Generar un ID de sesión único
        sessionId = Math.random().toString(36).substring(2, 15);
        console.log("Generando nueva sesión de carrito:", sessionId);
        
        // Configurar cookie con configuración permisiva para desarrollo
        res.cookie('cart_session_id', sessionId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: false, // Para que el cliente JS pueda leerla
          sameSite: 'none', // Más permisivo para desarrollo
          secure: false, // No requerir HTTPS en desarrollo
          path: '/' // Disponible en todas las rutas
        });
        console.log("Cookie establecida:", sessionId);
      } else {
        console.log("Cookie existente encontrada:", sessionId);
      }
      
      // Buscar un carrito existente para esta sesión con estado active
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      console.log(`Carritos encontrados para sesión ${sessionId}:`, existingCarts.length);
      
      let cart = existingCarts.find(c => c.status === 'active');
      
      // Si no existe un carrito activo, crear uno nuevo
      if (!cart) {
        console.log("Creando nuevo carrito para sesión:", sessionId);
        let webUserId = null;
        
        // Si el usuario está autenticado, asociar el carrito con su cuenta
        if (req.isAuthenticated() && req.user?.webUserId) {
          webUserId = req.user.webUserId;
          console.log("Usuario autenticado:", webUserId);
        }
        
        cart = await storage.createCart({
          webUserId,
          sessionId,
          status: 'active'
        });
        console.log("Nuevo carrito creado:", cart.id);
      } else {
        console.log("Carrito existente encontrado:", cart.id);
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
      
      console.log("Solicitud para agregar al carrito:", req.body);
      
      // Obtener sessionId desde cookie o generar uno nuevo si no existe
      let sessionId = req.cookies?.cart_session_id;
      
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        console.log("Creando nueva sesión de carrito:", sessionId);
        // Configurar cookie con configuración permisiva para desarrollo
        res.cookie('cart_session_id', sessionId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: false, // Para que el cliente JS pueda leerla
          sameSite: 'none', // Más permisivo para desarrollo
          secure: false, // No requerir HTTPS en desarrollo
          path: '/' // Disponible en todas las rutas
        });
      } else {
        console.log("Usando sesión existente:", sessionId);
      }
      
      // Buscar un carrito existente para esta sesión
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      console.log("Carritos encontrados para la sesión:", existingCarts.length);
      
      let cart = existingCarts.find(c => c.status === 'active');
      
      // Si no existe un carrito activo, crear uno nuevo
      if (!cart) {
        console.log("Creando nuevo carrito para la sesión:", sessionId);
        let webUserId = null;
        
        // Si el usuario está autenticado, asociar el carrito con su cuenta
        if (req.isAuthenticated() && req.user?.webUserId) {
          webUserId = req.user.webUserId;
          console.log("Usuario autenticado con webUserId:", webUserId);
        }
        
        cart = await storage.createCart({
          webUserId,
          sessionId,
          status: 'active'
        });
        console.log("Nuevo carrito creado con ID:", cart.id);
      } else {
        console.log("Usando carrito existente con ID:", cart.id);
      }
      
      const cartId = cart.id;
      
      // Verificar que el producto existe y tiene stock
      const product = await storage.getProduct(productId);
      if (!product) {
        console.log("Producto no encontrado:", productId);
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      console.log("Producto encontrado:", product.name);
      
      // Verificar stock disponible
      let stockToCheck = parseFloat(product.stock.toString());
      let quantityToDeduct = parseFloat(quantity);
      
      console.log("Stock disponible:", stockToCheck, "Cantidad solicitada:", quantityToDeduct);
      
      // Si es una presentación específica (unidad diferente a la base), aplicar conversión
      if (unit !== product.baseUnit && product.conversionRates) {
        const conversions = product.conversionRates as any;
        console.log("Conversiones disponibles:", Object.keys(conversions));
        
        if (conversions && conversions[unit]) {
          const conversionFactor = parseFloat(conversions[unit].factor);
          quantityToDeduct = quantityToDeduct * conversionFactor;
          console.log(`Aplicando factor de conversión ${conversionFactor} para ${unit}`);
          console.log(`Cantidad original ${quantity}, cantidad a descontar del stock: ${quantityToDeduct}`);
        }
      }
      
      if (quantityToDeduct > stockToCheck) {
        console.log("Stock insuficiente. Solicitado:", quantityToDeduct, "Disponible:", stockToCheck);
        return res.status(400).json({ message: "No hay suficiente stock disponible" });
      }
      
      // Obtener el precio
      let price = parseFloat(product.price.toString());
      
      // Si es una presentación específica, usar el precio de la presentación
      if (unit !== product.baseUnit && product.conversionRates) {
        const conversions = product.conversionRates as any;
        if (conversions && conversions[unit] && conversions[unit].price) {
          price = parseFloat(conversions[unit].price);
          console.log(`Usando precio de presentación: ${price} para ${unit}`);
        }
      }
      
      // Calcular total
      const total = price * parseFloat(quantity);
      console.log(`Precio: ${price}, Cantidad: ${quantity}, Total: ${total}`);
      
      // Crear item en el carrito
      console.log("Creando item en el carrito:", {
        cartId,
        productId,
        quantity,
        unit,
        price: price.toString()
      });
      
      const cartItem = await storage.createCartItem({
        cartId,
        productId,
        quantity,
        unit,
        price: price.toString(),
        notes
      });
      
      console.log("Item creado en el carrito con ID:", cartItem.id);
      
      // Actualizar el total del carrito
      const allCartItems = await storage.getCartItemsByCartId(cartId);
      console.log("Total de items en el carrito:", allCartItems.length);
      
      const cartTotal = allCartItems.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity), 0);
      const cartTotalItems = allCartItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      
      console.log("Actualizando carrito. Nuevo total:", cartTotal, "Cantidad de items:", cartTotalItems);
      
      await storage.updateCart(cartId, {
        totalAmount: cartTotal.toString(),
        totalItems: cartTotalItems,
        updatedAt: new Date()
      });
      
      // Enviar la misma cookie de nuevo para asegurar que se establezca correctamente
      res.cookie('cart_session_id', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      console.log("Respondiendo con item agregado al carrito");
      
      res.status(201).json({
        ...cartItem,
        product
      });
    } catch (error) {
      console.error("Error al agregar item al carrito:", error);
      res.status(400).json({ message: "Error al agregar producto al carrito", error: (error as Error).message });
    }
  });
  
  // Obtener los ítems del carrito actual
  app.get("/api/web/cart/items", async (req, res) => {
    try {
      console.log("COOKIES RECIBIDAS en /api/web/cart/items:", req.cookies);
      
      // Obtener sessionId desde cookie o de la URL
      let sessionId = req.cookies?.cart_session_id;
      
      // Si no hay sessionId en la cookie, verificar en los headers y crear uno nuevo si es necesario
      if (!sessionId) {
        console.log("No hay sessionId en la cookie, creando uno nuevo");
        sessionId = Math.random().toString(36).substring(2, 15);
        // Configurar cookie con configuración permisiva para desarrollo
        res.cookie('cart_session_id', sessionId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: false, // Para que el cliente JS pueda leerla
          sameSite: 'none', // Más permisivo para desarrollo
          secure: false, // No requerir HTTPS en desarrollo
          path: '/' // Disponible en todas las rutas
        });
        console.log("Nueva cookie cart_session_id creada:", sessionId);
        
        // Como es nueva, no habrá items todavía
        return res.json([]);
      }
      
      console.log("Obteniendo ítems del carrito para la sesión:", sessionId);
      
      // Buscar un carrito existente para esta sesión
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      console.log("Carritos encontrados para la sesión:", existingCarts.length);
      
      const cart = existingCarts.find(c => c.status === 'active');
      
      if (!cart) {
        console.log("No se encontró un carrito activo para la sesión", sessionId);
        
        // Crear un nuevo carrito para esta sesión
        console.log("Creando un nuevo carrito para la sesión:", sessionId);
        const newCart = await storage.createCart({
          sessionId,
          status: 'active',
          totalAmount: '0',
          totalItems: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log("Nuevo carrito creado con ID:", newCart.id);
        return res.json([]);
      }
      
      console.log("Carrito encontrado con ID:", cart.id);
      
      // Reforzar la cookie en cada respuesta para asegurar que está correctamente configurada
      res.cookie('cart_session_id', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Obtener items del carrito
      const cartItems = await storage.getCartItemsByCartId(cart.id);
      console.log("Ítems del carrito encontrados:", cartItems.length);
      
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
      
      console.log("Respondiendo con ítems enriquecidos:", enrichedItems.length);
      res.json(enrichedItems);
    } catch (error) {
      console.error("Error al obtener ítems del carrito:", error);
      res.status(500).json({ message: "Error al obtener ítems del carrito", error: (error as Error).message });
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
        customerData, 
        paymentMethod
      } = req.body;
      
      // Verificar que existe la sesión
      const sessionId = req.sessionID;
      if (!sessionId) {
        return res.status(400).json({ message: "Sesión no válida" });
      }
      
      // Si no se especifica cartId, buscar el carrito por la sesión
      let cart;
      if (cartId) {
        cart = await storage.getCart(cartId);
      } else {
        const carts = await storage.getCartsBySessionId(sessionId);
        cart = carts.find(c => c.status === "active");
      }
      
      if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
      }
      
      // Obtener items del carrito
      const cartItems = await storage.getCartItemsByCartId(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "El carrito está vacío" });
      }
      
      // Crear la orden en el sistema principal
      // Para órdenes web usamos un ID de usuario administrador
      const adminUsers = await storage.getAllUsers();
      const adminUser = adminUsers.find(u => u.role === "admin") || adminUsers[0];
      
      if (!adminUser) {
        return res.status(500).json({ message: "No se encontró un usuario administrador para procesar la orden" });
      }
      
      // Calcular el total
      const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity), 0);
      
      // Crear la orden
      const order = await storage.createOrder({
        userId: adminUser.id,
        total: total.toString(),
        status: "pending",
        notes: customerData.notes || "",
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // entrega al día siguiente
        isWebOrder: true,
        source: "web",
        paymentMethod: paymentMethod, // efectivo o transferencia
        customerData: JSON.stringify(customerData) // almacenamos los datos del cliente en formato JSON
      });
      
      // Crear items de la orden
      for (const item of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: (parseFloat(item.price) * parseFloat(item.quantity)).toString(),
          productName: item.productName // añadimos el nombre del producto para facilitar la visualización
        });
      }
      
      // Marcar el carrito como convertido
      await storage.updateCart(cart.id, {
        status: "converted",
        updatedAt: new Date()
      });
      
      res.status(201).json({
        id: order.id,
        total: order.total,
        status: order.status,
        customerData,
        paymentMethod,
        items: await storage.getOrderItemsByOrderId(order.id),
        timestamp: order.timestamp
      });
    } catch (error) {
      res.status(400).json({ message: "Error al crear orden", error: (error as Error).message });
    }
  });
  
  // Obtener orden por ID
  app.get("/api/web/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      
      // Obtener los items de la orden
      const items = await storage.getOrderItemsByOrderId(orderId);
      
      // Extraer datos del cliente desde el campo JSON
      let customerData = {};
      if (order.customerData) {
        try {
          customerData = JSON.parse(order.customerData);
        } catch (e) {
          console.error("Error al parsear datos del cliente:", e);
        }
      }
      
      // Verificar si hay una entrega asociada
      const deliveries = await storage.getAllDeliveries();
      const delivery = deliveries.find(d => d.orderId === orderId);
      
      res.json({
        id: order.id,
        status: order.status,
        notes: order.notes,
        customerId: order.customerId,
        timestamp: order.timestamp,
        total: order.total,
        customerData,
        paymentMethod: order.paymentMethod,
        items
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener la orden", error: (error as Error).message });
    }
  });

  // Seguimiento de pedido (mantenemos esta funcionalidad si se necesita)
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

  // Este endpoint ya existía y fue eliminado para evitar duplicación
  
  // Endpoint para obtener pedidos del usuario web
  app.get("/api/web/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    try {
      // Obtener todos los pedidos
      const allOrders = await storage.getAllOrders();
      
      // Filtrar los pedidos web del usuario actual
      const userOrders = allOrders
        .filter(order => order.isWebOrder && order.customerData)
        .map(order => {
          let customerData = {};
          try {
            customerData = JSON.parse(order.customerData || '{}');
          } catch (e) {
            console.error("Error al parsear datos del cliente:", e);
          }
          
          // Si el usuario está autenticado, filtrar solo sus pedidos
          if (customerData.customerId === req.user.customerId || 
              customerData.email === req.user.email) {
            return order;
          }
          return null;
        })
        .filter(Boolean); // Eliminar nulls
      
      // Enriquecer con items de cada pedido
      const enrichedOrders = await Promise.all(
        userOrders.map(async (order) => {
          const items = await storage.getOrderItemsByOrderId(order.id);
          
          // Enriquecer los items con datos del producto
          const enrichedItems = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                productName: product ? product.name : "Producto desconocido"
              };
            })
          );
          
          return {
            ...order,
            items: enrichedItems
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedidos", error: (error as Error).message });
    }
  });
  
  // Actualizar perfil de usuario web
  app.put("/api/web/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    try {
      const { name, email, phone, address, city, province } = req.body;
      const userId = req.user.id;
      
      // Actualizar el usuario
      const updatedUser = await storage.updateUser(userId, {
        fullName: name
      });
      
      // Si el usuario está asociado a un cliente, actualizar también los datos del cliente
      if (req.user.customerId) {
        await storage.updateCustomer(req.user.customerId, {
          name, 
          email, 
          phone, 
          address,
          city,
          province
        });
      }
      
      const { password, ...userData } = updatedUser;
      res.json({
        ...userData,
        name: userData.fullName,
        email,
        phone,
        address,
        city,
        province
      });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el perfil", error: (error as Error).message });
    }
  });
  
  // Cambiar contraseña de usuario web
  app.put("/api/web/user/password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Verificar la contraseña actual
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const passwordMatches = await comparePasswords(currentPassword, user.password);
      if (!passwordMatches) {
        return res.status(400).json({ message: "La contraseña actual es incorrecta" });
      }
      
      // Hash de la nueva contraseña
      const hashedPassword = await hashPassword(newPassword);
      
      // Actualizar la contraseña
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al cambiar la contraseña", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
