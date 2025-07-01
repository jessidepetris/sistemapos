import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import passport from "passport";
import { Router } from "express";
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "./api/bank-accounts";
import { getProductionOrders, createProductionOrder, updateProductionOrder, deleteProductionOrder } from "./api/production-orders";
import { scrapePrices } from "./scraper";
import { checkAfipStatus, createAfipInvoice } from "./api/afip";
import {
  InsertSale,
  InsertSaleItem,
  quotations,
  quotationItems,
  sales,
  saleItems,
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      
      // Obtener clientes nuevos
      const customers = await storage.getAllCustomers() || [];
      // Temporalmente consideramos a todos como nuevos
      const newCustomers = customers;
      
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
        return new Date(b.timestamp ?? '').getTime() - new Date(a.timestamp ?? '').getTime();
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
        .sort((a, b) => new Date(b.timestamp ?? '').getTime() - new Date(a.timestamp ?? '').getTime())
        .slice(0, 2)
        .map((sale, index) => {
          const user = users.find((u: any) => u.id === sale.userId);
          const timeAgo = getTimeAgo(sale.timestamp ?? '');
          
          return {
            id: `sale-${sale.id}`,
            user: user ? (user.fullName || user.username) : "Usuario",
            action: `registró una venta de $${parseFloat(sale.total).toFixed(2)}`,
            timeAgo,
            type: "sale",
            timestamp: new Date(sale.timestamp ?? '').getTime()
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
      let products = await storage.getAllProducts();

      // Optional search by name or description
      const search = (req.query.search as string | undefined)?.toLowerCase();
      if (search) {
        products = products.filter((p) =>
          p.name.toLowerCase().includes(search) ||
          (p.description?.toLowerCase().includes(search))
        );
      }

      // Optional sorting by name or price
      const sort = req.query.sort as string | undefined;
      if (sort === "name") {
        products = products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === "price") {
        products = products.sort(
          (a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"),
        );
      }

      res.json(products);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener productos", error: (error as Error).message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = { ...req.body };

      // Calcular costo unitario si se proporciona costo por bulto
      const unitsForCalc = parseFloat(productData.unitsPerPack?.toString() || "1");
      if (!productData.cost && productData.packCost && unitsForCalc > 0) {
        productData.cost = (parseFloat(productData.packCost) / unitsForCalc).toString();
      }
      
      // Agregar la fecha de última actualización
      productData.lastUpdated = new Date().toISOString();
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Error al crear producto", error: (error as Error).message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let productData = { ...req.body };

      // Calcular costo unitario si se proporciona costo por bulto
      const unitsForCalc = parseFloat(productData.unitsPerPack?.toString() || "1");
      if (!productData.cost && productData.packCost && unitsForCalc > 0) {
        productData.cost = (parseFloat(productData.packCost) / unitsForCalc).toString();
      }
      
      console.log(`[PUT /api/products/${id}] Recibida solicitud de actualización con datos:`, JSON.stringify(productData, null, 2));
      
      // Si es un producto compuesto, calcular el costo automáticamente
      if (productData.isComposite && productData.components) {
        let components;
        
        // Parsear los componentes si están en formato string
        if (typeof productData.components === 'string') {
          try {
            components = JSON.parse(productData.components);
          } catch (e) {
            console.error("Error al parsear componentes:", e);
            components = [];
          }
        } else {
          components = productData.components;
        }
        
        if (components && components.length > 0) {
          // Calcular costo total basado en los componentes
          let totalCost = 0;
          
          for (const component of components) {
            const componentProduct = await storage.getProduct(component.productId);
            if (componentProduct && componentProduct.cost) {
              const componentCost = parseFloat(componentProduct.cost.toString());
              const quantity = parseFloat(component.quantity);
              totalCost += componentCost * quantity;
            }
          }
          
          console.log(`Producto compuesto actualizado: Costo calculado automáticamente = ${totalCost}`);
          productData.cost = totalCost;
        }
      }
      
      // Verificar que el producto exista antes de actualizarlo
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        console.error(`[PUT /api/products/${id}] Error: Producto no encontrado`);
        return res.status(404).json({ message: "Producto no encontrado", error: `Producto con ID ${id} no existe` });
      }
      
      console.log(`[PUT /api/products/${id}] Producto existente encontrado:`, existingProduct.name);
      
      // Agregar la fecha de última actualización solo si no viene en los datos
      if (!productData.lastUpdated) {
        productData.lastUpdated = new Date().toISOString();
      }
      
      const product = await storage.updateProduct(id, productData);
      console.log(`[PUT /api/products/${id}] Producto actualizado correctamente:`, product.name);
      
      // Asegurar que se envíe como JSON
      res.setHeader('Content-Type', 'application/json');
      res.json({
        ...product,
        message: "Producto actualizado correctamente"
      });
    } catch (error) {
      console.error(`[PUT /api/products/:id] Error al actualizar producto:`, error);
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
      
      const { accountId, amount, type, description, paymentMethod } = req.body;
      
      console.log("Solicitud de transacción recibida:", { accountId, amount, type, description, userId, paymentMethod });
      
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ message: "Cuenta no encontrada" });
      }
      
      // Calculate new balance
      let newBalance = parseFloat(account.balance.toString());
      if (type === "credit") {
        newBalance -= parseFloat(amount);  // Un crédito (pago) DISMINUYE el saldo deudor
      } else if (type === "debit") {
        newBalance += parseFloat(amount);  // Un débito (cargo) AUMENTA el saldo deudor
      }
      
      console.log("Nuevo balance calculado:", newBalance);
      
      // Create transaction
      const transaction = await storage.createAccountTransaction({
        accountId,
        amount,
        type,
        description,
        userId,
        paymentMethod: type === "credit" ? paymentMethod : undefined, // Solo guardamos el método de pago para créditos
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

  app.post('/api/sales', async (req, res) => {
    console.log('\n=== Iniciando proceso de venta ===');
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Session:', req.session);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Verificar sesión
      if (!(req.session as any).passport?.user) {
        console.log('Error: Sesión no encontrada en passport');
        return res.status(401).json({ 
          code: "SESSION_EXPIRED",
          message: "La sesión ha expirado. Por favor, inicie sesión nuevamente." 
        });
      }

      const userId = (req.session as any).passport.user;
      console.log('Usuario autenticado con ID:', userId);
      
      // Obtener el usuario completo
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('Error: Usuario no encontrado en la base de datos');
        return res.status(401).json({ 
          code: "USER_NOT_FOUND",
          message: "Usuario no encontrado" 
        });
      }
      console.log('Usuario encontrado:', user.username);
      
      // Extraer los campos del body, aceptando ambos nombres para compatibilidad
      const {
        items,
        paymentMethods,
        discountPercent = 0,
        surchargePercent = 0,
        customerId = null,
      } = req.body;
      // Permitir ambos nombres, pero usar los correctos para guardar
      const documentType = req.body.documentType || req.body.docType || "remito";
      const invoiceNumber = req.body.invoiceNumber || req.body.docNumber || null;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('Error: No hay items en la venta');
        return res.status(400).json({ message: 'La venta debe contener al menos un item' });
      }

      if (!paymentMethods || !Array.isArray(paymentMethods) || paymentMethods.length === 0) {
        console.log('Error: No hay métodos de pago');
        return res.status(400).json({ message: 'Debe especificar al menos un método de pago' });
      }

      // Verificar stock y disponibilidad de productos
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Producto con ID ${item.productId} no encontrado` });
        }
        
        // Verificar si el producto está activo o es discontinuo con stock
        if (!product.active && !(product.isDiscontinued && parseFloat(product.stock.toString()) > 0)) {
          return res.status(400).json({ message: `El producto "${product.name}" no está disponible para la venta` });
        }
        
        // Verificar stock suficiente
        if (parseFloat(product.stock.toString()) < item.quantity) {
          return res.status(400).json({ message: `Stock insuficiente para el producto "${product.name}"` });
        }
      }

      // Calcular subtotal
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      // Calcular descuento y recargo
      const discount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
      const surcharge = surchargePercent > 0 ? subtotal * (surchargePercent / 100) : 0;
      // Calcular total
      const total = subtotal - discount + surcharge;
      console.log('Subtotal:', subtotal, 'Descuento:', discount, 'Recargo:', surcharge, 'Total:', total);

      // Crear la venta con los nombres correctos de campos
      const sale = await storage.createSale({
        customerId,
        userId: userId,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        discountPercent: discountPercent.toString(),
        surcharge: surcharge.toFixed(2),
        surchargePercent: surchargePercent.toString(),
        total: total.toFixed(2),
        paymentMethod: paymentMethods[0]?.method || "efectivo",
        documentType,
        invoiceNumber,
        status: "completed"
      });

      console.log('Venta creada exitosamente:', sale.id);

      // Prorratear el descuento entre los ítems
      let prorratedTotal = 0;
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const product = await storage.getProduct(item.productId);
        const itemSubtotal = item.price * item.quantity;
        const proportion = subtotal > 0 ? itemSubtotal / subtotal : 0;
        let itemDiscount = discount * proportion;
        // Ajuste de redondeo en el último ítem
        if (idx === items.length - 1) {
          itemDiscount = discount - prorratedTotal;
        } else {
          prorratedTotal += itemDiscount;
        }
        const itemTotal = itemSubtotal - itemDiscount;
        await storage.createSaleItem({
          saleId: sale.id,
          productId: item.productId,
          name: product?.name || 'Producto',
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          discount: itemDiscount.toFixed(2),
          total: itemTotal.toFixed(2)
        });
        // Actualizar stock
        if (product) {
          const newStock = parseFloat(product.stock) - parseFloat(item.quantity);
          await storage.updateProduct(product.id, { stock: newStock.toString() });
          console.log(`Stock actualizado para producto ${product.id}: ${newStock}`);
        }
      }

      // Crear los pagos
      for (const payment of paymentMethods) {
        console.log(`Procesando pago:`, payment);
        await storage.createPayment({
          saleId: sale.id,
          amount: payment.amount,
          method: payment.method,
          accountId: payment.accountId
        });
      }

      console.log('=== Proceso de venta completado ===\n');
      
      res.json(sale);
    } catch (error) {
      console.error('Error en el proceso de venta:', error);
      res.status(500).json({ message: 'Error al procesar la venta' });
    }
  });

  // Helper functions for different payment types
  async function handleCashPayment(account: any, amount: number, docType: string, docNumber: string | number, saleId: number, userId: number) {
    // Primer movimiento: Débito por la venta
    await storage.createAccountTransaction({
      accountId: account.id,
      amount,
      type: "debit",
      description: `${docType} ${docNumber}`,
      relatedSaleId: saleId,
      userId,
      balanceAfter: parseFloat(account.balance.toString()) + amount
    });

    const newBalance = parseFloat(account.balance.toString()) + amount;

    // Segundo movimiento: Crédito por el pago en efectivo
    await storage.createAccountTransaction({
      accountId: account.id,
      amount,
      type: "credit",
      description: `Pago en efectivo - ${docType} ${docNumber}`,
      relatedSaleId: saleId,
      userId,
      balanceAfter: newBalance - amount
    });

    // Actualizar el saldo final de la cuenta
    await storage.updateAccount(account.id, { 
      balance: (newBalance - amount).toString(),
      lastUpdated: new Date().toISOString()
    });
  }

  async function handleTransferPayment(account: any, amount: number, docType: string, docNumber: string | number, saleId: number, userId: number) {
    // Primer movimiento: Débito por la venta
    await storage.createAccountTransaction({
      accountId: account.id,
      amount,
      type: "debit",
      description: `${docType} ${docNumber}`,
      relatedSaleId: saleId,
      userId,
      balanceAfter: parseFloat(account.balance.toString()) + amount
    });

    const newBalance = parseFloat(account.balance.toString()) + amount;

    // Segundo movimiento: Crédito por el pago por transferencia
    await storage.createAccountTransaction({
      accountId: account.id,
      amount,
      type: "credit",
      description: `Pago por transferencia - ${docType} ${docNumber}`,
      relatedSaleId: saleId,
      userId,
      balanceAfter: newBalance - amount
    });

    // Actualizar el saldo final de la cuenta
    await storage.updateAccount(account.id, { 
      balance: (newBalance - amount).toString(),
      lastUpdated: new Date().toISOString()
    });
  }

  async function handleAccountPayment(account: any, amount: number, docType: string, docNumber: string | number, saleId: number, userId: number, paymentMethod: string): Promise<void> {
    // Primer movimiento: Débito por la venta
    const currentBalance = parseFloat(account.balance.toString());
    const debitBalance = currentBalance + amount;  // Un débito AUMENTA el saldo
    
    await storage.createAccountTransaction({
        accountId: account.id,
        amount,
        type: "debit",
        description: `${docType} ${docNumber}`,
        relatedSaleId: saleId,
        userId,
        balanceAfter: debitBalance.toString()
    });

    // Solo registramos el pago si NO es en cuenta corriente
    if (paymentMethod !== 'current_account') {
        // Segundo movimiento: Crédito por el pago
        let paymentDescription = '';
        switch (paymentMethod) {
            case 'cash':
                paymentDescription = `Pago en efectivo`;
                break;
            case 'transfer':
                paymentDescription = `Pago por transferencia`;
                break;
            case 'qr':
                paymentDescription = `Pago por QR`;
                break;
            case 'credit_card':
                paymentDescription = `Pago con tarjeta de crédito`;
                break;
            case 'debit_card':
                paymentDescription = `Pago con tarjeta de débito`;
                break;
            case 'check':
                paymentDescription = `Pago con cheque`;
                break;
            default:
                paymentDescription = `Pago`;
        }
        
        const creditBalance = debitBalance - amount;  // Un crédito REDUCE el saldo
        
        await storage.createAccountTransaction({
            accountId: account.id,
            amount,
            type: "credit",
            description: `${paymentDescription} - ${docType} ${docNumber}`,
            relatedSaleId: saleId,
            userId,
            balanceAfter: creditBalance.toString()
        });

        // Actualizar el saldo final después del pago
        await storage.updateAccount(account.id, { 
            balance: creditBalance.toString(),
            lastUpdated: new Date().toISOString()
        });
    } else {
        // Si es cuenta corriente, solo actualizamos con el débito
        await storage.updateAccount(account.id, { 
            balance: debitBalance.toString(),
            lastUpdated: new Date().toISOString()
        });
    }
  }

  async function calculateNewBalance(accountId: number): Promise<number> {
    const transactions = await storage.getAccountTransactions(accountId);
    
    // Ordenar las transacciones por fecha
    transactions.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA.getTime() - dateB.getTime();
    });
    
    // Calcular el saldo acumulado en orden cronológico
    let balance = 0;
    for (const transaction of transactions) {
        if (transaction.type === 'credit') {
            balance -= parseFloat(transaction.amount.toString());  // Un crédito (pago) REDUCE el saldo
        } else {
            balance += parseFloat(transaction.amount.toString());  // Un débito (cargo) AUMENTA el saldo
        }
        
        // Actualizar el balanceAfter en la base de datos
        try {
            await storage.updateAccountTransactionBalance(transaction.id, balance.toString());
        } catch (error) {
            console.error("Error actualizando balance de transacción:", error);
        }
    }
    
    return balance;
  }

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

  // Endpoint para convertir un pedido en factura (remito)
  app.post("/api/invoices/from-order/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Verificar si el pedido existe
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // Verificar si el pedido ya está facturado
      if (order.status === "invoiced") {
        return res.status(400).json({ message: "Este pedido ya ha sido facturado anteriormente" });
      }
      
      // Obtener los ítems del pedido
      const orderItems = await storage.getOrderItemsByOrderId(orderId);
      
      if (orderItems.length === 0) {
        return res.status(400).json({ message: "El pedido no tiene productos para facturar" });
      }
      
      // Extraer datos del body
      const { 
        documentType = "remito", 
        paymentMethod = "efectivo", 
        notes = "",
        printOptions = { printTicket: true, sendEmail: false },
        discountPercent = 0,
        surchargePercent = 0,
        paymentDetails = {} // Agregar extracción de paymentDetails
      } = req.body;
      
      // Calcular el total con descuento y recargo
      let subtotal = parseFloat(order.total);
      let discountAmount = 0;
      let surchargeAmount = 0;
      
      if (discountPercent > 0) {
        discountAmount = subtotal * (discountPercent / 100);
        subtotal -= discountAmount;
      }
      
      if (surchargePercent > 0) {
        surchargeAmount = subtotal * (surchargePercent / 100);
        subtotal += surchargeAmount;
      }
      
      // Crear una nueva venta (factura/remito)
      const invoice = await storage.createSale({
        customerId: order.customerId,
        userId: req.user?.id || 1, // Usar el usuario autenticado o el ID 1 por defecto
        total: subtotal.toString(), // Usar el subtotal ya calculado con descuento
        subtotal: order.total,
        tax: "0", // Para simplificar, sin impuestos
        discount: discountAmount.toString(),
        surcharge: surchargeAmount.toString(),
        discountPercent: discountPercent.toString(),
        surchargePercent: surchargePercent.toString(),
        documentType, // Usar el tipo de documento enviado
        documentNumber: "", // Se generará automáticamente
        paymentMethod, // Usar el método de pago enviado
        paymentStatus: "pagado", // Por defecto, pagado
        notes: notes || `Generado desde pedido #${orderId}. ${order.notes || ''}`,
        source: "sistema",
        printOptions: JSON.stringify(printOptions),
        status: "completed" // Establecer explícitamente el estado como completado
      });
      
      // Actualizar cuenta corriente del cliente si corresponde
      if (order.customerId) {
        const account = await storage.getAccountByCustomerId(order.customerId);
        if (account) {
          const docTypeText = documentType === 'remito' ? 'Remito' : 'Factura';
          const docNumber = invoice.id;

          // Handle different payment methods
          if (paymentMethod === 'cash' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.cash > 0)) {
            const cashAmount = paymentMethod === 'cash' ? subtotal : paymentDetails.mixedPayment.cash;
            await handleAccountPayment(account, cashAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'cash');
          }

          if (paymentMethod === 'transfer' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.transfer > 0)) {
            const transferAmount = paymentMethod === 'transfer' ? subtotal : paymentDetails.mixedPayment.transfer;
            await handleAccountPayment(account, transferAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'transfer');
          }

          if (paymentMethod === 'qr' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.qr > 0)) {
            const qrAmount = paymentMethod === 'qr' ? subtotal : paymentDetails.mixedPayment.qr;
            await handleAccountPayment(account, qrAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'qr');
          }

          if (paymentMethod === 'credit_card' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.credit_card > 0)) {
            const creditCardAmount = paymentMethod === 'credit_card' ? subtotal : paymentDetails.mixedPayment.credit_card;
            await handleAccountPayment(account, creditCardAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'credit_card');
          }

          if (paymentMethod === 'debit_card' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.debit_card > 0)) {
            const debitCardAmount = paymentMethod === 'debit_card' ? subtotal : paymentDetails.mixedPayment.debit_card;
            await handleAccountPayment(account, debitCardAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'debit_card');
          }

          if (paymentMethod === 'check' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.check > 0)) {
            const checkAmount = paymentMethod === 'check' ? subtotal : paymentDetails.mixedPayment.check;
            await handleAccountPayment(account, checkAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'check');
          }

          if (paymentMethod === 'current_account' || (paymentMethod === 'mixed' && paymentDetails?.mixedPayment?.current_account > 0)) {
            const accountAmount = paymentMethod === 'current_account' ? subtotal : paymentDetails.mixedPayment.current_account;
            await handleAccountPayment(account, accountAmount, docTypeText, docNumber, invoice.id, req.user?.id || 1, 'current_account');
          }

          // Update account balance
          const newBalance = await calculateNewBalance(account.id);
          await storage.updateAccount(account.id, { balance: newBalance.toString(), lastUpdated: new Date().toISOString() });
        }
      }
      
      // Crear los ítems de la factura a partir de los ítems del pedido, prorrateando descuento y recargo de forma robusta y asíncrona
      const itemsSubtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
      let prorratedTotal = 0;
      for (let idx = 0; idx < orderItems.length; idx++) {
        const item = orderItems[idx];
        const itemSubtotal = parseFloat(item.total);
        const proportion = itemsSubtotal > 0 ? itemSubtotal / itemsSubtotal : 0;
        const itemDiscount = discountAmount * proportion;
        const itemSurcharge = surchargeAmount * proportion;
        let itemTotal = itemSubtotal;
        if (discountAmount > 0) itemTotal -= itemDiscount;
        if (surchargeAmount > 0) itemTotal += itemSurcharge;
        // Ajuste de redondeo en el último ítem
        if (idx === orderItems.length - 1) {
          itemTotal = parseFloat((subtotal - prorratedTotal).toFixed(2));
        } else {
          prorratedTotal += itemTotal;
        }
        const product = await storage.getProduct(item.productId);
        await storage.createSaleItem({
          saleId: invoice.id,
          productId: item.productId,
          name: product?.name || 'Producto',
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: itemTotal.toFixed(2),
          discount: itemDiscount.toFixed(2)
        });
        
        // Actualizar el stock del producto (descontando del stock reservado)
        if (product) {
          const newStock = parseFloat(product.stock) - parseFloat(item.quantity);
          await storage.updateProduct(product.id, { stock: newStock.toString() });
          console.log(`Stock actualizado para producto ${product.id}: ${newStock}`);
        }
      }
      
      // Actualizar el estado del pedido para marcar que ha sido facturado
      await storage.updateOrder(orderId, {
        customerId: order.customerId,
        total: order.total,
        status: "invoiced", // Nuevo estado para pedidos facturados
        notes: order.notes ? `${order.notes} - Facturado: ${new Date().toLocaleString()}` : `Facturado: ${new Date().toLocaleString()}`
      });
      
      // Obtener los datos de los productos para incluirlos en la respuesta
      const saleItems = await storage.getSaleItemsBySaleId(invoice.id);
      const productIds = saleItems.map(item => item.productId);
      const products = [];
      
      // Obtener información de cada producto
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (product) {
          products.push(product);
        }
      }
      
      // Devolver la factura creada
      res.status(201).json({
        id: invoice.id,
        message: "Factura creada correctamente",
        invoice: {
          ...invoice,
          items: saleItems,
          products: products, // Incluir los datos de los productos
          productsData: JSON.stringify(products) // Respaldo en formato JSON
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error al convertir pedido a factura", 
        error: (error as Error).message 
      });
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
          
          // Obtener información completa de los productos para cada item
          const enrichedItems = await Promise.all(items.map(async (item) => {
            // Obtener detalles del producto
            const product = await storage.getProduct(item.productId);
            // Agregar el producto al item
            return {
              ...item,
              product: product,
              // Asegurar que tengamos un nombre de producto
              productName: product?.name || item.productName || `Producto #${item.productId}`
            };
          }));
          
          return {
            ...order,
            customer,
            user,
            items: enrichedItems
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedidos", error: (error as Error).message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Enrich with customer data
      let customer = null;
      if (order.customerId) {
        customer = await storage.getCustomer(order.customerId);
      }
      
      const user = await storage.getUser(order.userId);
      
      // Get order items
      const items = await storage.getOrderItemsByOrderId(order.id);
      
      // Obtener información completa de los productos para cada item
      const enrichedItems = await Promise.all(items.map(async (item) => {
        // Obtener detalles del producto
        const product = await storage.getProduct(item.productId);
        // Agregar el producto al item
        return {
          ...item,
          product: product,
          // Asegurar que tengamos un nombre de producto
          productName: product?.name || item.productName || `Producto #${item.productId}`
        };
      }));
      
      const enrichedOrder = {
        ...order,
        customer,
        user,
        items: enrichedItems
      };
      
      res.json(enrichedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedido", error: (error as Error).message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      console.log("Creando nuevo pedido con datos:", req.body);
      const { customerId, total, status, notes, deliveryDate, items } = req.body;
      
      // Create order
      const order = await storage.createOrder({
        customerId,
        userId: req.user.id,
        total,
        status: status || "pending",
        notes,
        deliveryDate
      });
      
      console.log("Pedido creado:", order);
      
      // Create order items
      if (items && Array.isArray(items)) {
        console.log(`Procesando ${items.length} items del pedido`);
        
        for (const item of items) {
          console.log("Procesando item:", item);
          
          const orderItem = await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: item.total
          });
          
          console.log("Item de pedido creado:", orderItem);
        }
      } else {
        console.warn("No se proporcionaron items para el pedido o no es un array válido");
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      res.status(400).json({ message: "Error al crear pedido", error: (error as Error).message });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      // Eliminar temporalmente esta validación que puede estar causando el problema
      /*if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }*/
      
      const orderId = parseInt(req.params.id);
      const { customerId, total, status, notes, deliveryDate, items } = req.body;
      
      // Añadir log para depuración
      console.log("PUT /api/orders/:id - Datos recibidos:", {
        orderId,
        customerId,
        total,
        status,
        deliveryDate,
        itemsCount: items?.length || 0
      });
      
      // Verificar si el pedido existe
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Actualizar orden
      const updatedOrder = await storage.updateOrder(orderId, {
        customerId,
        total,
        status,
        notes,
        deliveryDate
      });
      
      // Obtener items existentes antes de eliminarlos para restaurar el stock
      const existingItems = await storage.getOrderItemsByOrderId(orderId);
      
      // Restaurar el stock de los items que serán eliminados
      for (const item of existingItems) {
        try {
          const product = await storage.getProduct(item.productId);
          if (product) {
            console.log(`[STOCK-RESTAURAR] Restaurando stock para producto: "${product.name}", ID: ${product.id}, Stock actual: ${product.stock}, Cantidad a restaurar: ${item.quantity}`);
            
            // Verificar si el producto es compuesto
            if (product.isComposite && product.components) {
              let components = [];
              try {
                components = typeof product.components === 'string' 
                  ? JSON.parse(product.components) 
                  : product.components;
                console.log(`[STOCK-RESTAURAR] Producto compuesto con ${components.length} componentes`);
              } catch (error) {
                console.error("[STOCK-RESTAURAR] Error al parsear componentes del producto:", error);
                components = [];
              }
              for (const component of components) {
                const componentProduct = await storage.getProduct(component.productId);
                if (componentProduct) {
                  const quantityToRestore = parseFloat(item.quantity) * parseFloat(component.quantity);
                  const newComponentStock = parseFloat(componentProduct.stock.toString()) + quantityToRestore;
                  console.log(`[STOCK-RESTAURAR] Restaurando stock de componente: "${componentProduct.name}", Stock anterior: ${componentProduct.stock}, Cantidad a restaurar: ${quantityToRestore}, Nuevo stock: ${newComponentStock}`);
                  
                  const updateResult = await storage.updateProduct(component.productId, { stock: newComponentStock.toString() });
                  console.log(`[STOCK-RESTAURAR] Resultado actualización stock componente:`, updateResult ? "OK" : "ERROR");
                  
                  // Verificar que el stock se actualizó correctamente
                  const updatedComponentProduct = await storage.getProduct(component.productId);
                  console.log(`[STOCK-RESTAURAR] Verificación stock componente actualizado: ${updatedComponentProduct?.stock}`);
                }
              }
            } else {
              // Para productos no compuestos (estándar)
              // Verificar si necesitamos aplicar factor de conversión
              let stockToRestore = parseFloat(item.quantity);
              
              // Verificar si la unidad del item es diferente a la unidad base del producto
              if (product.baseUnit && item.unit && item.unit !== product.baseUnit && product.conversionRates) {
                const conversions = typeof product.conversionRates === 'string' 
                  ? JSON.parse(product.conversionRates) 
                  : product.conversionRates;
                
                if (conversions && conversions[item.unit] && conversions[item.unit].factor) {
                  const conversionFactor = parseFloat(conversions[item.unit].factor);
                  stockToRestore = stockToRestore * conversionFactor;
                  console.log(`[STOCK-RESTAURAR] Aplicando factor de conversión ${conversionFactor} para ${item.unit}`);
                  console.log(`[STOCK-RESTAURAR] Cantidad original ${item.quantity}, cantidad a restaurar al stock: ${stockToRestore}`);
                }
              }
              
              const currentStock = parseFloat(product.stock.toString());
              const newStock = currentStock + stockToRestore;
              console.log(`[STOCK-RESTAURAR] Restaurando stock estándar - Stock anterior: ${currentStock}, Cantidad a restaurar: ${stockToRestore}, Nuevo stock: ${newStock}`);
              
              const updateResult = await storage.updateProduct(item.productId, { stock: newStock.toString() });
              console.log(`[STOCK-RESTAURAR] Resultado actualización stock estándar:`, updateResult ? "OK" : "ERROR");
              
              // Verificar que el stock se actualizó correctamente
              const updatedProduct = await storage.getProduct(item.productId);
              console.log(`[STOCK-RESTAURAR] Verificación stock actualizado: ${updatedProduct?.stock}`);
            }
          }
        } catch (error) {
          console.error("[STOCK-RESTAURAR] Error al restaurar stock:", error);
        }
      }
      
      // Eliminar items existentes
      await storage.deleteOrderItems(orderId);
      
      // Crear nuevos items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const orderItem = await storage.createOrderItem({
            orderId: orderId,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: item.total
          });
        }
      }
      
      // Responder con JSON y asegurar el Content-Type
      res.setHeader('Content-Type', 'application/json');
      res.json({
        ...updatedOrder,
        message: "Pedido actualizado correctamente"
      });
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      res.status(400).json({ message: "Error al actualizar pedido", error: (error as Error).message });
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
          
          // Si hay una cuenta de cliente, verificamos si hay transaccación asociada
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
              newBalance += parseFloat(amount);  // Una nota de crédito AUMENTA el saldo a favor (reduce el saldo deudor)
            } else if (type === "debit") {
              newBalance -= parseFloat(amount);  // Una nota de débito REDUCE el saldo a favor (aumenta el saldo deudor)
            }
            
            // Crear transacción en cuenta corriente
            accountTransaction = await storage.createAccountTransaction({
              accountId: account.id,
              amount,
              type: type === "credit" ? "credit" : "debit",
              description: `Nota de ${type === "credit" ? "crédito" : "débito"} #${note.id}: ${reason}`,
              relatedNoteId: note.id,
              userId: req.user.id,
              balanceAfter: newBalance
            });
            
            // Actualizar saldo en cuenta
            await storage.updateAccount(account.id, { 
              balance: newBalance.toString(), 
              lastUpdated: new Date().toISOString() 
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

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Nota no encontrada" });
      }

      let customer = null;
      if (note.customerId) {
        customer = await storage.getCustomer(note.customerId);
      }

      const user = await storage.getUser(note.userId);

      let relatedSale = null;
      if (note.relatedSaleId) {
        relatedSale = await storage.getSale(note.relatedSaleId);
        if (relatedSale && relatedSale.customerId) {
          const saleCustomer = await storage.getCustomer(relatedSale.customerId);
          if (saleCustomer) {
            relatedSale.customer = saleCustomer;
          }
        }
      }

      let accountTransaction = null;
      if (note.customerId && customer?.hasAccount) {
        const account = await storage.getAccountByCustomerId(note.customerId);
        if (account) {
          const transactions = await storage.getAccountTransactions(account.id);
          accountTransaction = transactions.find(t => t.relatedNoteId === note.id);
        }
      }

      res.json({
        ...note,
        customer,
        user: user ? { ...user, password: undefined } : null,
        relatedSale,
        accountTransaction
      });
    } catch (error) {
      console.error("Error al obtener nota:", error);
      res.status(500).json({ message: "Error al obtener nota", error: (error as Error).message });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const id = parseInt(req.params.id);
      const { reason, notes } = req.body;
      const updatedNote = await storage.updateNote(id, { reason, notes });
      res.json(updatedNote);
    } catch (error) {
      console.error("Error al actualizar nota:", error);
      res.status(400).json({ message: "Error al actualizar nota", error: (error as Error).message });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Nota no encontrada" });
      }

      await storage.deleteNote(id);

      if (note.customerId) {
        const customer = await storage.getCustomer(note.customerId);
        if (customer && customer.hasAccount) {
          const account = await storage.getAccountByCustomerId(note.customerId);
          if (account) {
            const transactions = await storage.getAccountTransactions(account.id);
            const accountTransaction = transactions.find(t => t.relatedNoteId === note.id);
            if (accountTransaction) {
              await storage.deleteAccountTransaction(accountTransaction.id);

              let newBalance = parseFloat(account.balance.toString());
              if (note.type === "credit") {
                newBalance -= parseFloat(note.amount);
              } else {
                newBalance += parseFloat(note.amount);
              }

              await storage.updateAccount(account.id, {
                balance: newBalance.toString(),
                lastUpdated: new Date().toISOString()
              });
            }
          }
        }
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error al eliminar nota:", error);
      res.status(400).json({ message: "Error al eliminar nota", error: (error as Error).message });
    }
  });

  app.get("/api/notes/:id/items", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const items = await storage.getNoteItemsByNoteId(noteId);
      const enriched = await Promise.all(items.map(async item => {
        const product = await storage.getProduct(item.productId);
        const replacement = item.replacementProductId ? await storage.getProduct(item.replacementProductId) : null;
        return { ...item, product, replacementProduct: replacement };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error al obtener items de nota:", error);
      res.status(500).json({ message: "Error al obtener items", error: (error as Error).message });
    }
  });

  app.post("/api/notes/:id/items", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const noteId = parseInt(req.params.id);
      const { productId, quantity, unit, price, total, action, replacementProductId } = req.body;
      const item = await storage.createNoteItem({
        noteId,
        productId,
        quantity,
        unit,
        price,
        total,
        action,
        replacementProductId,
      });

      const product = await storage.getProduct(productId);
      const replacementProduct = replacementProductId ? await storage.getProduct(replacementProductId) : null;

      res.status(201).json({ ...item, product, replacementProduct });
    } catch (error) {
      console.error("Error al crear item de nota:", error);
      res.status(400).json({ message: "Error al crear item", error: (error as Error).message });
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

  // Endpoint de estadísticas generales para logística
  app.get("/api/logistics/stats", async (_req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries();
      const vehicles = await storage.getAllVehicles();
      const routes = await storage.getAllDeliveryRoutes();
      const assignments = await storage.getAllRouteAssignments();

      const stats = {
        pendingDeliveries: deliveries.filter(d => d.status === "pending").length,
        inTransitDeliveries: deliveries.filter(d => d.status === "assigned" || d.status === "in_transit").length,
        completedDeliveries: deliveries.filter(d => d.status === "delivered").length,
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.active).length,
        totalRoutes: routes.length,
        pendingAssignments: assignments.filter(a => a.status === "pending").length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas", error: (error as Error).message });
    }
  });

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
  
  // Endpoint para obtener usuario web actual autenticado
  app.get("/api/web/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    try {
      // Asegurar que req.user existe
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Buscar cliente asociado
      let customer = null;
      if (req.user.customerId) {
        customer = await storage.getCustomer(req.user.customerId);
      } else {
        // Si no hay customerId directo, intentar buscar por nombre
        const allCustomers = await storage.getAllCustomers();
        customer = allCustomers.find(c => c.name === user.fullName);
      }
      
      // Excluir la contraseña de la respuesta
      const { password, ...userData } = user;
      
      res.json({
        ...userData,
        customerId: customer?.id || null,
        email: customer?.email || null,
        phone: customer?.phone || null,
        address: customer?.address || null,
        city: customer?.city || null,
        province: customer?.province || null
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener datos del usuario", error: (error as Error).message });
    }
  });
  
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
          conversionRates: p.conversionRates,
          isDiscontinued: p.isDiscontinued,
          stock: parseFloat(p.stock.toString())
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
        conversionRates: product.conversionRates,
        isDiscontinued: product.isDiscontinued,
        stock: parseFloat(product.stock.toString())
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
        paymentMethod,
        customerId
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

      let resolvedCustomerId: number | null = null;
      if (customerId) {
        const existing = await storage.getCustomer(Number(customerId));
        if (existing) {
          resolvedCustomerId = existing.id;
        }
      }

      if (!resolvedCustomerId && req.isAuthenticated() && req.user?.customerId) {
        const existing = await storage.getCustomer(req.user.customerId);
        if (existing) {
          resolvedCustomerId = existing.id;
        }
      }

      let finalCustomerData: any = { ...customerData };
      if (resolvedCustomerId) {
        const existing = await storage.getCustomer(resolvedCustomerId);
        if (existing) {
          finalCustomerData = {
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            address: existing.address,
            city: existing.city,
            province: existing.province,
            notes: customerData?.notes || "",
            customerId: resolvedCustomerId,
          };
        }
      }

      // Si el pedido no está asociado a un cliente existente, 
      // adjuntamos los datos proporcionados como parte de la nota
      let notes = finalCustomerData.notes || "";
      if (!resolvedCustomerId) {
        const detailParts: string[] = [];
        if (finalCustomerData.name) detailParts.push(`Nombre: ${finalCustomerData.name}`);
        if (finalCustomerData.email) detailParts.push(`Email: ${finalCustomerData.email}`);
        if (finalCustomerData.phone) detailParts.push(`Tel: ${finalCustomerData.phone}`);
        if (finalCustomerData.address) detailParts.push(`Dirección: ${finalCustomerData.address}`);
        if (finalCustomerData.city) detailParts.push(`Ciudad: ${finalCustomerData.city}`);
        if (finalCustomerData.province) detailParts.push(`Provincia: ${finalCustomerData.province}`);
        if (detailParts.length > 0) {
          const detailsString = detailParts.join(', ');
          notes = notes ? `${notes} - ${detailsString}` : detailsString;
        }
      }
      
      // Crear la orden
      const order = await storage.createOrder({
        userId: adminUser.id,
        total: total.toString(),
        status: "pending",
        notes,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // entrega al día siguiente
        isWebOrder: true,
        source: "web",
        paymentMethod: paymentMethod, // efectivo o transferencia
        customerId: resolvedCustomerId || undefined,
        customerData: JSON.stringify(finalCustomerData) // almacenamos los datos del cliente en formato JSON
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
        customerId: order.customerId,
        customerData: finalCustomerData,
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
      
      // Obtener datos del cliente
      let customerData = {};
      if (order.customerId) {
        const customer = await storage.getCustomer(order.customerId);
        if (customer) {
          customerData = {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            province: customer.province,
          };
        }
      } else if (order.customerData) {
        try {
          customerData = JSON.parse(order.customerData);
        } catch (e) {
          console.error("Error al parsear datos del cliente:", e);
        }
      } else if (order.customerId) {
        const customer = await storage.getCustomer(order.customerId);
        if (customer) {
          customerData = {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            province: customer.province,
          };
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
      const sessionId = req.cookies?.cart_session_id;

      if (!sessionId) {
        return res.status(400).json({ message: "No hay una sesión de carrito activa" });
      }

      // Buscar el carrito activo de la sesión
      const existingCarts = await storage.getCartsBySessionId(sessionId);
      const cart = existingCarts.find((c) => c.status === "active");

      // Si no hay carrito activo consideramos la operación exitosa
      if (!cart) {
        return res.json({ success: true });
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
        updatedAt: new Date(),
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
      const userOrders = allOrders.filter(order => {
        if (!order.isWebOrder) return false;


        if (order.customerData) {
          try {
            const data = JSON.parse(order.customerData);
            if (req.user.customerId && data.customerId) {
              return data.customerId === req.user.customerId;
            }
            if (data.email && data.email === req.user.email) {
              return true;
            }
          } catch (e) {
            console.error("Error al parsear datos del cliente:", e);
          }
        } else if (order.customerId && req.user.customerId) {
          return order.customerId === req.user.customerId;

        }

        return false;
      });
      
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

          let customerInfo: any = {};

          if (order.customerData) {
            try {
              customerInfo = JSON.parse(order.customerData);
            } catch (e) {
              console.error("Error al parsear datos del cliente:", e);
            }
          } else if (order.customerId) {

            const customer = await storage.getCustomer(order.customerId);
            if (customer) {
              customerInfo = {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                province: customer.province,
              };
            }
          }

          return {
            ...order,
            customerData: JSON.stringify(customerInfo),
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

  // Reports endpoints
  app.get("/api/reports/sales-by-day", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Última semana por defecto
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const sales = await storage.getAllSales() || [];
      
      // Mapa para almacenar ventas por día de la semana
      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const daysSales: Record<string, number> = {};
      
      // Inicializar con ceros
      for (const day of dayNames) {
        daysSales[day] = 0;
      }
      
      // Agrupar ventas por día de la semana
      for (const sale of sales) {
        const saleDate = new Date(sale.timestamp as string);
        
        // Comprobar si la venta está dentro del rango
        if (saleDate >= start && saleDate <= end) {
          const dayName = dayNames[saleDate.getDay()];
          daysSales[dayName] += parseFloat(sale.total);
        }
      }
      
      // Preparar datos para el gráfico
      const result = {
        labels: Object.keys(daysSales),
        datasets: [
          {
            label: "Ventas por día",
            data: Object.values(daysSales).map(value => Math.round(value * 100) / 100), // Redondear a 2 decimales
            backgroundColor: "hsl(215, 70%, 60%)",
          },
        ],
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error al generar reporte de ventas por día:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });
  
  app.get("/api/reports/sales-by-category", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Último mes por defecto
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const sales = await storage.getAllSales() || [];
      const products = await storage.getAllProducts() || [];
      
      // Crear categorías básicas de productos
      const categories = {
        "Pastelería": 0,
        "Chocolate": 0,
        "Harinas": 0,
        "Esencias": 0,
        "Colorantes": 0,
        "Otros": 0,
      };
      
      // Para cada venta en el rango
      for (const sale of sales) {
        const saleDate = new Date(sale.timestamp as string);
        
        // Comprobar si la venta está dentro del rango
        if (saleDate >= start && saleDate <= end) {
          // Obtener items de la venta
          const saleItems = await storage.getSaleItemsBySaleId(sale.id);
          
          for (const item of saleItems) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              // Determinar categoría basada en el nombre del producto
              let category = "Otros";
              if (product.name.toLowerCase().includes("chocolate") || product.name.toLowerCase().includes("cacao")) {
                category = "Chocolate";
              } else if (product.name.toLowerCase().includes("harina") || product.name.toLowerCase().includes("trigo")) {
                category = "Harinas";
              } else if (product.name.toLowerCase().includes("esencia") || product.name.toLowerCase().includes("vainilla")) {
                category = "Esencias";
              } else if (product.name.toLowerCase().includes("colorante") || product.name.toLowerCase().includes("color")) {
                category = "Colorantes";
              } else if (product.name.toLowerCase().includes("pastel") || product.name.toLowerCase().includes("torta")) {
                category = "Pastelería";
              }
              
              // Sumar al total de la categoría
              const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
              categories[category] += itemTotal;
            }
          }
        }
      }
      
      // Eliminar categorías sin ventas
      const filteredCategories: Record<string, number> = {};
      Object.entries(categories).forEach(([category, total]) => {
        if (total > 0) {
          filteredCategories[category] = total;
        }
      });
      
      // Si no hay categorías con ventas, mantener al menos una
      if (Object.keys(filteredCategories).length === 0) {
        filteredCategories["Sin ventas"] = 0;
      }
      
      // Colores para el gráfico
      const colors = [
        "hsl(215, 70%, 60%)",
        "hsl(260, 70%, 60%)",
        "hsl(10, 70%, 60%)",
        "hsl(130, 70%, 60%)",
        "hsl(45, 70%, 60%)",
        "hsl(300, 70%, 60%)",
      ];
      
      // Preparar datos para el gráfico de pie
      const result = {
        labels: Object.keys(filteredCategories),
        datasets: [
          {
            label: "Ventas por categoría",
            data: Object.values(filteredCategories).map(value => Math.round(value * 100) / 100), // Redondear a 2 decimales
            backgroundColor: colors.slice(0, Object.keys(filteredCategories).length),
            borderColor: Array(Object.keys(filteredCategories).length).fill("#ffffff"),
            borderWidth: 1,
          },
        ],
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error al generar reporte de ventas por categoría:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });
  
  app.get("/api/reports/sales-trend", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // Últimos 6 meses por defecto
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const sales = await storage.getAllSales() || [];
      
      // Mapa para almacenar ventas por mes
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthlySales: Record<string, number> = {};
      
      // Obtener el rango de meses
      const startMonth = start.getMonth();
      const startYear = start.getFullYear();
      const endMonth = end.getMonth();
      const endYear = end.getFullYear();
      
      // Inicializar meses en el rango
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === endYear ? endMonth : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          const key = `${monthNames[month]} ${year}`;
          monthlySales[key] = 0;
        }
      }
      
      // Agrupar ventas por mes
      for (const sale of sales) {
        const saleDate = new Date(sale.timestamp as string);
        
        // Comprobar si la venta está dentro del rango
        if (saleDate >= start && saleDate <= end) {
          const key = `${monthNames[saleDate.getMonth()]} ${saleDate.getFullYear()}`;
          monthlySales[key] = (monthlySales[key] || 0) + parseFloat(sale.total);
        }
      }
      
      // Preparar datos para el gráfico
      const result = {
        labels: Object.keys(monthlySales),
        datasets: [
          {
            label: "Tendencia de Ventas",
            data: Object.values(monthlySales).map(value => Math.round(value * 100) / 100), // Redondear a 2 decimales
            borderColor: "hsl(215, 70%, 60%)",
            backgroundColor: "transparent",
            tension: 0.2,
          },
        ],
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error al generar reporte de tendencia de ventas:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });
  
  app.get("/api/reports/sales-detail", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Último mes por defecto
      const end = endDate ? new Date(endDate as string) : new Date();

      const sales = await storage.getAllSales() || [];
      const customers = await storage.getAllCustomers() || [];

      // Filtrar ventas por fecha
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp as string);
        return saleDate >= start && saleDate <= end;
      });

      // Enriquecer datos de ventas y mantener la fecha como objeto para ordenarla
      const detailedSales = await Promise.all(filteredSales.map(async (sale) => {
        const customer = customers.find(c => c.id === sale.customerId);
        const saleItems = await storage.getSaleItemsBySaleId(sale.id);

        const dateObj = new Date(sale.timestamp as string);

        return {
          id: sale.id,
          dateObj,
          customer: customer ? customer.name : "Cliente no registrado",
          total: parseFloat(sale.total).toFixed(2),
          items: saleItems.length,
          status: sale.status || "completed",
        };
      }));

      // Ordenar por fecha (más recientes primero)
      detailedSales.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

      // Formatear fecha para la respuesta final
      const response = detailedSales.map(sale => ({
        id: sale.id,
        date: sale.dateObj.toLocaleDateString(),
        customer: sale.customer,
        total: sale.total,
        items: sale.items,
        status: sale.status,
      }));

      res.json(response);
    } catch (error) {
      console.error("Error al generar reporte detallado de ventas:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });
  
  app.get("/api/reports/inventory-status", async (req, res) => {
    try {
      const products = await storage.getAllProducts() || [];
      
      // Categorizar productos por nivel de stock
      const inventoryStatus = {
        critical: 0,  // stock < 5
        low: 0,       // stock < 10
        normal: 0,    // stock < 50
        high: 0       // stock >= 50
      };
      
      for (const product of products) {
        const stock = parseFloat(product.stock);
        if (stock < 5) {
          inventoryStatus.critical++;
        } else if (stock < 10) {
          inventoryStatus.low++;
        } else if (stock < 50) {
          inventoryStatus.normal++;
        } else {
          inventoryStatus.high++;
        }
      }
      
      // Preparar datos para el gráfico
      const result = {
        labels: ["Crítico", "Bajo", "Normal", "Alto"],
        datasets: [
          {
            label: "Estado de Inventario",
            data: [
              inventoryStatus.critical,
              inventoryStatus.low,
              inventoryStatus.normal,
              inventoryStatus.high
            ],
            backgroundColor: [
              "hsl(0, 70%, 60%)",
              "hsl(45, 70%, 60%)",
              "hsl(215, 70%, 60%)",
              "hsl(130, 70%, 60%)"
            ],
            borderColor: Array(4).fill("#ffffff"),
            borderWidth: 1,
          },
        ],
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error al generar reporte de estado de inventario:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });
  
  // Product Categories endpoints
  app.get("/api/product-categories", async (req, res) => {
    try {
      const categories = await storage.getAllProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías de productos" });
    }
  });
  
  app.get("/api/product-categories/root", async (req, res) => {
    try {
      const rootCategories = await storage.getProductCategoriesByParentId(null);
      res.json(rootCategories);
    } catch (error) {
      console.error("Error al obtener categorías raíz:", error);
      res.status(500).json({ error: "Error al obtener categorías principales" });
    }
  });
  
  app.get("/api/product-categories/:id/subcategories", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subCategories = await storage.getProductCategoriesByParentId(id);
      res.json(subCategories);
    } catch (error) {
      console.error("Error al obtener subcategorías:", error);
      res.status(500).json({ error: "Error al obtener subcategorías" });
    }
  });
  
  app.get("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error al obtener categoría:", error);
      res.status(500).json({ error: "Error al obtener categoría" });
    }
  });
  
  app.post("/api/product-categories", async (req, res) => {
    try {
      const { name, description, imageUrl, active, displayOrder, slug, parentId } = req.body;

      // Validar campos requeridos
      if (!name || !slug) {
        return res.status(400).json({
          error: 'Campos requeridos faltantes',
          details: {
            name: !name ? 'El nombre es requerido' : undefined,
            slug: !slug ? 'El slug es requerido' : undefined
          }
        });
      }

      // Validar que el slug sea único
      const existingCategory = await storage.getProductCategoryBySlug(slug);
      if (existingCategory) {
        return res.status(400).json({
          error: 'El slug ya está en uso',
          details: {
            slug: 'Ya existe una categoría con este slug'
          }
        });
      }

      // Validar parentId si se proporciona
      if (parentId) {
        const parentCategory = await storage.getProductCategory(parentId);
        if (!parentCategory) {
          return res.status(400).json({
            error: 'Categoría padre no válida',
            details: {
              parentId: 'La categoría padre especificada no existe'
            }
          });
        }
      }

      const category = await storage.createProductCategory({
        name,
        description,
        imageUrl,
        active: active ?? true,
        displayOrder: displayOrder ?? 0,
        slug,
        parentId
      });

      res.json(category);
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        error: 'Error al crear la categoría',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });
  
  app.put("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validar datos de entrada
      const schema = z.object({
        name: z.string().min(1, "El nombre es requerido").optional(),
        description: z.string().optional().nullable(),
        imageUrl: z.string().optional().nullable(),
        parentId: z.number().optional().nullable(),
        displayOrder: z.number().optional(),
        active: z.boolean().optional(),
        slug: z.string().min(1, "El slug es requerido").optional(),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Datos de categoría inválidos", 
          details: validation.error.format()
        });
      }
      
      // Si hay parentId, verificar que exista la categoría padre
      if (req.body.parentId !== undefined) {
        // Evitar ciclos (una categoría no puede ser su propia subcategoría)
        if (req.body.parentId === id) {
          return res.status(400).json({ error: "Una categoría no puede ser su propia subcategoría" });
        }
        
        // Si parentId es null, se permite (es una categoría raíz)
        if (req.body.parentId !== null) {
          const parentCategory = await storage.getProductCategory(req.body.parentId);
          if (!parentCategory) {
            return res.status(400).json({ error: "La categoría padre no existe" });
          }
          
          // Verificar si no estamos creando un ciclo en la jerarquía
          let tempCategory = parentCategory;
          while (tempCategory && tempCategory.parentId) {
            if (tempCategory.parentId === id) {
              return res.status(400).json({ 
                error: "No se puede asignar como padre a una subcategoría (ciclo en la jerarquía)"
              });
            }
            tempCategory = await storage.getProductCategory(tempCategory.parentId);
          }
        }
      }
      
      const updatedCategory = await storage.updateProductCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        error: 'Error al actualizar la categoría',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });
  
  app.delete("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Primero verificamos si la categoría existe
      const category = await storage.getProductCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      
      await storage.deleteProductCategory(id);
      res.json({ success: true, message: "Categoría eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      // Si el error es sobre categorías hijas o productos asignados, enviamos 400
      if (error instanceof Error && error.message.includes("subcategorías") || 
          error instanceof Error && error.message.includes("productos")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Error al eliminar categoría" });
    }
  });
  
  // Product-Category relation endpoints
  app.get("/api/products/:productId/categories", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      
      // Verificar que el producto exista
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      const categories = await storage.getProductCategoriesByProductId(productId);
      res.json(categories);
    } catch (error) {
      console.error("Error al obtener categorías del producto:", error);
      res.status(500).json({ error: "Error al obtener categorías del producto" });
    }
  });
  
  app.get("/api/product-categories/:categoryId/products", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      // Verificar que la categoría exista
      const category = await storage.getProductCategory(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      console.error("Error al obtener productos de la categoría:", error);
      res.status(500).json({ error: "Error al obtener productos de la categoría" });
    }
  });
  
  app.post("/api/products/:productId/categories/:categoryId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      
      // Verificar que el producto y la categoría existan
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      const category = await storage.getProductCategory(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      
      // Verificar si ya existe la relación
      const existingRelation = await storage.getProductCategoryRelation(productId, categoryId);
      if (existingRelation) {
        return res.status(400).json({ error: "El producto ya está asignado a esta categoría" });
      }
      
      // Si es la primera categoría, marcarla como principal
      const productCategories = await storage.getProductCategoriesByProductId(productId);
      const isPrimary = productCategories.length === 0;
      
      const relation = await storage.addProductToCategory(productId, categoryId, isPrimary);
      res.status(201).json(relation);
    } catch (error) {
      console.error("Error al asignar producto a categoría:", error);
      res.status(500).json({ error: "Error al asignar producto a categoría" });
    }
  });
  
  app.delete("/api/products/:productId/categories/:categoryId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      
      // Verificar que exista la relación
      const relation = await storage.getProductCategoryRelation(productId, categoryId);
      if (!relation) {
        return res.status(404).json({ error: "La relación no existe" });
      }
      
      // Si es la categoría principal, asignar otra como principal
      if (relation.isPrimary) {
        const otherCategories = await storage.getProductCategoriesByProductId(productId);
        const otherCategory = otherCategories.find(cat => cat.id !== categoryId);
        
        if (otherCategory) {
          await storage.updateProductCategoryRelation(productId, otherCategory.id, { isPrimary: true });
        }
      }
      
      await storage.removeProductFromCategory(productId, categoryId);
      res.json({ success: true, message: "Categoría quitada correctamente" });
    } catch (error) {
      console.error("Error al quitar categoría del producto:", error);
      res.status(500).json({ error: "Error al quitar categoría del producto" });
    }
  });

  // Compras
  app.get('/api/purchases', async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error('Error al obtener compras:', error);
      res.status(500).json({ error: 'Error al obtener compras' });
    }
  });

  app.get('/api/purchases/:id', async (req, res) => {
    try {
      const purchase = await storage.getPurchase(Number(req.params.id));
      if (!purchase) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }
      res.json(purchase);
    } catch (error) {
      console.error('Error al obtener compra:', error);
      res.status(500).json({ error: 'Error al obtener compra' });
    }
  });

  app.post('/api/purchases', async (req, res) => {
    try {
      const purchaseData = {
        ...req.body,
        userId: req.user?.id || 1, // Usar el ID del usuario autenticado o un valor por defecto
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      const purchase = await storage.createPurchase(purchaseData);

      // Actualizar el stock de los productos
      if (purchaseData.items && Array.isArray(purchaseData.items)) {
        for (const item of purchaseData.items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const currentStock = parseFloat(product.stock.toString());
            const newStock = currentStock + parseFloat(item.quantity.toString());
            await storage.updateProduct(item.productId, { stock: newStock.toString() });
          }
        }
      }

      res.status(201).json(purchase);
    } catch (error) {
      console.error('Error al crear compra:', error);
      res.status(500).json({ error: 'Error al crear compra' });
    }
  });

  app.put('/api/purchases/:id', async (req, res) => {
    try {
      // Obtener la compra actual para comparar los items
      const currentPurchase = await storage.getPurchase(Number(req.params.id));
      if (!currentPurchase) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      // Revertir el stock de los items actuales
      if (currentPurchase.items && Array.isArray(currentPurchase.items)) {
        for (const item of currentPurchase.items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const currentStock = parseFloat(product.stock.toString());
            const newStock = currentStock - parseFloat(item.quantity.toString());
            await storage.updateProduct(item.productId, { stock: newStock.toString() });
          }
        }
      }

      // Actualizar la compra
      const purchase = await storage.updatePurchase(Number(req.params.id), req.body);

      // Actualizar el stock con los nuevos items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const currentStock = parseFloat(product.stock.toString());
            const newStock = currentStock + parseFloat(item.quantity.toString());
            await storage.updateProduct(item.productId, { stock: newStock.toString() });
          }
        }
      }

      res.json(purchase);
    } catch (error) {
      console.error('Error al actualizar compra:', error);
      res.status(500).json({ error: 'Error al actualizar compra' });
    }
  });

  app.delete('/api/purchases/:id', async (req, res) => {
    try {
      await storage.deletePurchase(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      res.status(500).json({ error: 'Error al eliminar compra' });
    }
  });

  // Items de compra
  app.get('/api/purchases/:id/items', async (req, res) => {
    try {
      const items = await storage.getPurchaseItems(Number(req.params.id));
      res.json(items);
    } catch (error) {
      console.error('Error al obtener items de compra:', error);
      res.status(500).json({ error: 'Error al obtener items de compra' });
    }
  });

  app.post('/api/purchases/:id/items', async (req, res) => {
    try {
      const itemData = {
        ...req.body,
        purchaseId: Number(req.params.id),
        total: Number(req.body.quantity) * Number(req.body.cost)
      };
      const item = await storage.createPurchaseItem(itemData);

      // Actualizar el stock del producto
      const product = await storage.getProduct(itemData.productId);
      if (product) {
        const currentStock = parseFloat(product.stock.toString());
        const newStock = currentStock + Number(itemData.quantity);
        await storage.updateProduct(itemData.productId, { stock: newStock.toString() });
      }

      res.status(201).json(item);
    } catch (error) {
      console.error('Error al crear item de compra:', error);
      res.status(500).json({ error: 'Error al crear item de compra' });
    }
  });

  // Endpoint para obtener información del usuario web actual
  app.get("/api/web/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Si el usuario está asociado a un cliente, obtener sus datos
      let customerData = {};
      if (user.role === 'cliente') {
        const allCustomers = await storage.getAllCustomers();
        const customer = allCustomers.find(c => c.name === user.fullName);
        
        if (customer) {
          customerData = {
            customerId: customer.id,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            province: customer.province
          };
        }
      }
      
      // Devolver datos del usuario sin la contraseña
      const { password, ...userData } = user;
      res.json({
        ...userData,
        name: userData.fullName,
        ...customerData
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener información del usuario", error: (error as Error).message });
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.id);
      
      // Obtener el ítem del pedido antes de eliminarlo para restaurar el stock
      const orderItem = await storage.getOrderItem(orderItemId);
      if (!orderItem) {
        return res.status(404).json({ message: "Ítem de pedido no encontrado" });
      }
      
      try {
        // Restaurar el stock reservado al eliminar un ítem de pedido
        const product = await storage.getProduct(orderItem.productId);
        if (product) {
          console.log(`[STOCK-RESTAURAR] Restaurando stock reservado para producto: "${product.name}", ID: ${product.id}, Stock actual: ${product.stock}, Cantidad a restaurar: ${orderItem.quantity}`);
          
          // Verificar si el producto es compuesto
          if (product.isComposite && product.components) {
            let components = [];
            try {
              components = typeof product.components === 'string' 
                ? JSON.parse(product.components) 
                : product.components;
              console.log(`[STOCK-RESTAURAR] Producto compuesto con ${components.length} componentes`);
            } catch (error) {
              console.error("[STOCK-RESTAURAR] Error al parsear componentes del producto:", error);
              components = [];
            }
            
            // Por cada componente, restaurar su stock reservado proporcionalmente
            for (const component of components) {
              const componentProduct = await storage.getProduct(component.productId);
              if (componentProduct) {
                const quantityToRestore = parseFloat(orderItem.quantity) * parseFloat(component.quantity);
                const currentReservedStock = parseFloat(componentProduct.reservedStock?.toString() || "0");
                const newReservedStock = currentReservedStock - quantityToRestore;
                
                console.log(`[STOCK-RESTAURAR] Restaurando stock reservado de componente: "${componentProduct.name}", Stock reservado anterior: ${currentReservedStock}, Cantidad a restaurar: ${quantityToRestore}, Nuevo stock reservado: ${newReservedStock}`);
                
                await storage.updateProduct(component.productId, { 
                  reservedStock: newReservedStock.toString() 
                });
              }
            }
          } else {
            // Para productos no compuestos (estándar)
            try {
              // Verificar si necesitamos aplicar factor de conversión
              let stockToRestore = parseFloat(orderItem.quantity);
              
              // Verificar si la unidad del item es diferente a la unidad base del producto
              if (product.baseUnit && orderItem.unit && orderItem.unit !== product.baseUnit && product.conversionRates) {
                const conversions = typeof product.conversionRates === 'string' 
                  ? JSON.parse(product.conversionRates) 
                  : product.conversionRates;
                
                console.log("[STOCK-RESTAURAR] Tasas de conversión:", conversions);
                
                if (conversions && conversions[orderItem.unit] && conversions[orderItem.unit].factor) {
                  const conversionFactor = parseFloat(conversions[orderItem.unit].factor);
                  stockToRestore = stockToRestore * conversionFactor;
                  console.log(`[STOCK-RESTAURAR] Aplicando factor de conversión ${conversionFactor} para ${orderItem.unit}`);
                  console.log(`[STOCK-RESTAURAR] Cantidad original ${orderItem.quantity}, cantidad a restaurar al stock reservado: ${stockToRestore}`);
                }
              }
              
              const currentReservedStock = parseFloat(product.reservedStock?.toString() || "0");
              const newReservedStock = currentReservedStock - stockToRestore;
              console.log(`[STOCK-RESTAURAR] Actualizando stock reservado - Stock reservado anterior: ${currentReservedStock}, Cantidad a restaurar: ${stockToRestore}, Nuevo stock reservado: ${newReservedStock}`);
              
              await storage.updateProduct(orderItem.productId, { 
                reservedStock: newReservedStock.toString() 
              });
            } catch (stockError) {
              console.error("[STOCK-RESTAURAR] Error al restaurar el stock reservado del producto:", stockError);
            }
          }
        }
      } catch (productError) {
        console.error("[STOCK-RESTAURAR] Error al procesar el producto para restaurar stock:", productError);
      }
      
      // Eliminar el ítem del pedido
      const result = await storage.deleteOrderItem(orderItemId);
      if (result) {
        res.status(200).json({ message: "Ítem de pedido eliminado correctamente" });
      } else {
        res.status(500).json({ message: "Error al eliminar ítem de pedido" });
      }
    } catch (error) {
      console.error("Error al eliminar ítem de pedido:", error);
      res.status(400).json({ message: "Error al eliminar ítem de pedido", error: (error as Error).message });
    }
  });

  // Endpoint para eliminar un ítem de orden específico
  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Obtener el item antes de eliminarlo
      const orderItem = await storage.getOrderItem(itemId);
      if (!orderItem) {
        return res.status(404).json({ message: "Item de pedido no encontrado" });
      }
      
      // Obtener el producto asociado al item
      const product = await storage.getProduct(orderItem.productId);
      if (product) {
        console.log(`[STOCK-RESTAURAR] Restaurando stock para producto: "${product.name}", ID: ${product.id}, Stock actual: ${product.stock}, Cantidad a restaurar: ${orderItem.quantity}`);
        
        // Verificar si el producto es compuesto
        if (product.isComposite && product.components) {
          let components = [];
          try {
            components = typeof product.components === 'string' 
              ? JSON.parse(product.components) 
              : product.components;
            console.log(`[STOCK-RESTAURAR] Producto compuesto con ${components.length} componentes`);
          } catch (error) {
            console.error("[STOCK-RESTAURAR] Error al parsear componentes del producto:", error);
            components = [];
          }
          
          // Por cada componente, restaurar su stock proporcionalmente
          for (const component of components) {
            const componentProduct = await storage.getProduct(component.productId);
            if (componentProduct) {
              const quantityToRestore = parseFloat(orderItem.quantity) * parseFloat(component.quantity);
              const newComponentStock = parseFloat(componentProduct.stock.toString()) + quantityToRestore;
              console.log(`[STOCK-RESTAURAR] Restaurando stock de componente: "${componentProduct.name}", Stock anterior: ${componentProduct.stock}, Cantidad a restaurar: ${quantityToRestore}, Nuevo stock: ${newComponentStock}`);
              
              await storage.updateProduct(component.productId, { stock: newComponentStock.toString() });
            }
          }
        } else {
          // Para productos no compuestos (estándar)
          // Verificar si necesitamos aplicar factor de conversión
          let stockToRestore = parseFloat(orderItem.quantity);
          
          // Verificar si la unidad del item es diferente a la unidad base del producto
          if (product.baseUnit && orderItem.unit && orderItem.unit !== product.baseUnit && product.conversionRates) {
            const conversions = typeof product.conversionRates === 'string' 
              ? JSON.parse(product.conversionRates) 
              : product.conversionRates;
            
            if (conversions && conversions[orderItem.unit] && conversions[orderItem.unit].factor) {
              const conversionFactor = parseFloat(conversions[orderItem.unit].factor);
              stockToRestore = stockToRestore * conversionFactor;
              console.log(`[STOCK-RESTAURAR] Aplicando factor de conversión ${conversionFactor} para ${orderItem.unit}`);
              console.log(`[STOCK-RESTAURAR] Cantidad original ${orderItem.quantity}, cantidad a restaurar al stock: ${stockToRestore}`);
            }
          }
          
          const currentStock = parseFloat(product.stock.toString());
          const newStock = currentStock + stockToRestore;
          console.log(`[STOCK-RESTAURAR] Restaurando stock estándar - Stock anterior: ${currentStock}, Cantidad a restaurar: ${stockToRestore}, Nuevo stock: ${newStock}`);
          
          await storage.updateProduct(orderItem.productId, { stock: newStock.toString() });
        }
      }
      
      // Eliminar el item del pedido
      await storage.deleteOrderItem(itemId);
      
      res.json({ message: "Item de pedido eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar item de pedido:", error);
      res.status(400).json({ message: "Error al eliminar item de pedido", error: (error as Error).message });
    }
  });

  // Ruta para generar reportes de ganancias
  app.get("/api/reports/profit", async (req, res) => {
    try {
      // Obtener parámetros de fecha desde la solicitud
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      // Asegurar que la fecha de fin incluya todo el día
      endDate.setHours(23, 59, 59, 999);

      // Obtener todas las ventas
      const allSales = await storage.getAllSales() || [];
      
      // Filtrar ventas por fecha
      const filteredSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      // Obtener detalles de cada venta
      const salesDetails = await Promise.all(filteredSales.map(async (sale) => {
        // Obtener los items de la venta
        const saleItems = await storage.getSaleItemsBySaleId(sale.id);
        
        // Calcular costos y ganancias por item
        const itemsWithProfit = await Promise.all(saleItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          const costPrice = product ? parseFloat(product.cost || "0") : 0;
          const sellPrice = parseFloat(item.price);
          const quantity = parseFloat(item.quantity);
          
          const totalCost = costPrice * quantity;
          const totalSell = sellPrice * quantity;
          const profit = totalSell - totalCost;
          const profitMargin = totalSell > 0 ? (profit / totalSell) * 100 : 0;
          
          return {
            ...item,
            productName: product ? product.name : "Producto desconocido",
            costPrice,
            profit,
            profitMargin
          };
        }));
        
        // Calcular totales para la venta
        const totalCost = itemsWithProfit.reduce((sum, item) => sum + (item.costPrice * parseFloat(item.quantity)), 0);
        const totalSell = parseFloat(sale.total);
        const totalProfit = totalSell - totalCost;
        const profitMargin = totalSell > 0 ? (totalProfit / totalSell) * 100 : 0;
        
        // Obtener información del cliente
        let customerInfo = "Cliente no registrado";
        if (sale.customerId) {
          const customer = await storage.getCustomer(sale.customerId);
          if (customer) {
            customerInfo = customer.name;
          }
        }
        
        return {
          id: sale.id,
          date: sale.timestamp,
          customer: customerInfo,
          items: itemsWithProfit,
          totalCost,
          totalSell,
          totalProfit,
          profitMargin
        };
      }));
      
      // Calcular resumen del periodo
      const summary = {
        periodStart: startDate,
        periodEnd: endDate,
        totalSales: filteredSales.length,
        totalRevenue: salesDetails.reduce((sum, sale) => sum + sale.totalSell, 0),
        totalCost: salesDetails.reduce((sum, sale) => sum + sale.totalCost, 0),
        totalProfit: salesDetails.reduce((sum, sale) => sum + sale.totalProfit, 0),
        averageProfitMargin: salesDetails.length > 0 
          ? salesDetails.reduce((sum, sale) => sum + sale.profitMargin, 0) / salesDetails.length 
          : 0,
        // Ventas por día para gráfico
        dailySales: getDailySalesSummary(salesDetails) || []
      };
      
      res.json({
        summary,
        salesDetails: salesDetails || []
      });
      
    } catch (error) {
      console.error("Error al generar reporte de ganancias:", error);
      res.status(500).json({ 
        error: "Error al generar reporte de ganancias",
        summary: {
          periodStart: new Date(),
          periodEnd: new Date(),
          totalSales: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          averageProfitMargin: 0,
          dailySales: []
        },
        salesDetails: []
      });
    }
  });
  
  // Función para agrupar ventas por día
  function getDailySalesSummary(salesDetails) {
    const dailyMap = new Map();
    
    salesDetails.forEach(sale => {
      const date = new Date(sale.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0
        });
      }
      
      const dailyData = dailyMap.get(dateKey);
      dailyMap.set(dateKey, {
        ...dailyData,
        revenue: dailyData.revenue + sale.totalSell,
        cost: dailyData.cost + sale.totalCost,
        profit: dailyData.profit + sale.totalProfit,
        salesCount: dailyData.salesCount + 1
      });
    });
    
    // Convertir el Map a un array ordenado por fecha
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Ruta para generar reportes de productos más rentables
  app.get("/api/reports/profitable-products", async (req, res) => {
    try {
      // Obtener parámetros de fecha desde la solicitud
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      // Asegurar que la fecha de fin incluya todo el día
      endDate.setHours(23, 59, 59, 999);

      // Obtener todas las ventas
      const allSales = await storage.getAllSales() || [];
      
      // Filtrar ventas por fecha
      const filteredSales = allSales.filter((sale: any) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      // Obtener todos los productos
      const products = await storage.getAllProducts() || [];
      
      // Mapa para acumular datos por producto
      const productMap = new Map();
      
      // Procesar cada venta y sus items
      for (const sale of filteredSales) {
        const saleItems = await storage.getSaleItemsBySaleId(sale.id);
        
        for (const item of saleItems) {
          const product = products.find(p => p.id === item.productId);
          if (!product) continue;
          
          const costPrice = parseFloat(product.cost || "0");
          const sellPrice = parseFloat(item.price);
          const quantity = parseFloat(item.quantity);
          
          const totalCost = costPrice * quantity;
          const totalSell = sellPrice * quantity;
          const profit = totalSell - totalCost;
          
          const productId = product.id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: product.name,
              totalQuantity: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0
            });
          }
          
          const productData = productMap.get(productId);
          productMap.set(productId, {
            ...productData,
            totalQuantity: productData.totalQuantity + quantity,
            totalRevenue: productData.totalRevenue + totalSell,
            totalCost: productData.totalCost + totalCost,
            totalProfit: productData.totalProfit + profit
          });
        }
      }
      
      // Convertir el mapa a array y calcular márgenes de ganancia
      let productProfits = Array.from(productMap.values()).map(product => {
        const profitMargin = product.totalRevenue > 0 
          ? (product.totalProfit / product.totalRevenue) * 100 
          : 0;
          
        return {
          ...product,
          profitMargin
        };
      });
      
      // Ordenar por ganancia total (de mayor a menor)
      productProfits = productProfits.sort((a, b) => b.totalProfit - a.totalProfit);
      
      // Siempre devolver un array, incluso si está vacío
      res.json(productProfits || []);
      
    } catch (error) {
      console.error("Error al generar reporte de productos rentables:", error);
      res.status(500).json({ error: "Error al generar reporte de productos rentables" });
    }
  });

  // Actualización masiva de precio de costo por porcentaje
  app.post('/api/products/update-cost-by-percentage', async (req, res) => {
    try {
      const { percentage, filterByCategoryId, filterBySupplierId } = req.body;
      
      // Validación básica
      if (typeof percentage !== 'number' || isNaN(percentage)) {
        return res.status(400).json({ 
          error: 'El porcentaje debe ser un número válido'
        });
      }
      
      // Obtener productos según los filtros
      let products = await storage.getAllProducts();
      
      // Aplicar filtro por categoría si se proporciona
      if (filterByCategoryId) {
        const categoryProducts = await storage.getProductsByCategory(filterByCategoryId);
        const categoryProductIds = new Set(categoryProducts.map(p => p.id));
        products = products.filter(p => categoryProductIds.has(p.id));
      }
      
      // Aplicar filtro por proveedor si se proporciona
      if (filterBySupplierId) {
        products = products.filter(p => p.supplierId === filterBySupplierId);
      }
      
      // Actualizar el costo de cada producto y recalcular precios
      const updatedProducts = [];
      for (const product of products) {
        const unitsPerPack = parseFloat(product.unitsPerPack?.toString() || "1");

        // Determinar el costo actual y el costo de bulto, si existe
        const currentPackCost = product.packCost ? parseFloat(product.packCost.toString()) : null;
        const currentCost = parseFloat(product.cost?.toString() || "0");

        if (currentPackCost !== null) {
          // Si existe costo por bulto, aplicar aumento sobre ese valor
          const newPackCost = currentPackCost * (1 + percentage / 100);
          const unitCost = unitsPerPack > 0 ? newPackCost / unitsPerPack : newPackCost;
          const roundedUnitCost = Math.round(unitCost * 100) / 100;

          // Obtener los valores actuales del producto
          const ivaRate = parseFloat(product.iva?.toString() || "21");
          const shippingRate = parseFloat(product.shipping?.toString() || "0");
          const profitRate = parseFloat(product.profit?.toString() || "55");
          const wholesaleProfitRate = parseFloat(product.wholesaleProfit?.toString() || "35");

          const costWithIva = roundedUnitCost * (1 + ivaRate / 100);
          const costWithShipping = costWithIva * (1 + shippingRate / 100);
          const newPrice = Math.round(costWithShipping * (1 + profitRate / 100) * 100) / 100;
          const newWholesalePrice = Math.round(costWithShipping * (1 + wholesaleProfitRate / 100) * 100) / 100;

          const updatedProduct = await storage.updateProduct(product.id, {
            cost: roundedUnitCost.toString(),
            packCost: newPackCost.toString(),
            price: newPrice.toString(),
            wholesalePrice: newWholesalePrice.toString(),
            lastUpdated: new Date()
          });
          updatedProducts.push(updatedProduct);
        } else if (currentCost) {
          // Si no hay costo por bulto, aumentar el costo unitario directamente
          const newCost = currentCost * (1 + percentage / 100);
          const roundedCost = Math.round(newCost * 100) / 100;

          const ivaRate = parseFloat(product.iva?.toString() || "21");
          const shippingRate = parseFloat(product.shipping?.toString() || "0");
          const profitRate = parseFloat(product.profit?.toString() || "55");
          const wholesaleProfitRate = parseFloat(product.wholesaleProfit?.toString() || "35");

          const costWithIva = roundedCost * (1 + ivaRate / 100);
          const costWithShipping = costWithIva * (1 + shippingRate / 100);
          const newPrice = Math.round(costWithShipping * (1 + profitRate / 100) * 100) / 100;
          const newWholesalePrice = Math.round(costWithShipping * (1 + wholesaleProfitRate / 100) * 100) / 100;

          const updatedProduct = await storage.updateProduct(product.id, {
            cost: roundedCost.toString(),
            price: newPrice.toString(),
            wholesalePrice: newWholesalePrice.toString(),
            lastUpdated: new Date()
          });
          updatedProducts.push(updatedProduct);
        }
      }
      
      res.json({
        message: `Se actualizó el costo de ${updatedProducts.length} productos con un aumento del ${percentage}%`,
        updatedProductsCount: updatedProducts.length,
        updatedProducts: updatedProducts // Incluir los productos actualizados en la respuesta
      });
      
    } catch (error) {
      console.error('Error al actualizar costos por porcentaje:', error);
      res.status(500).json({ 
        error: 'Error al actualizar costos de productos', 
        message: (error as Error).message 
      });
    }
  });
  
  // Actualización masiva de precio de costo por archivo (usando código de proveedor)
  app.post('/api/products/update-cost-by-file', async (req, res) => {
    try {
      const { products: productUpdates, supplierId, keepCurrentPrices = false } = req.body;
      
      // Validación básica
      if (!Array.isArray(productUpdates)) {
        return res.status(400).json({ 
          error: 'Se requiere un array de productos para actualizar' 
        });
      }
      
      const results = {
        success: 0,
        errors: [] as Array<{ supplierCode: string; message: string; details?: string }>,
        updatedProducts: [] as any[]
      };
      
      // Obtener todos los productos para buscar por código de proveedor
      let allProducts = await storage.getAllProducts();
      
      // Filtrar por proveedor si se especifica
      if (supplierId) {
        allProducts = allProducts.filter(p => p.supplierId === supplierId);
      }
      
      // Crear un mapa para búsqueda eficiente por código de proveedor
      const productsBySupplierCode = new Map();
      allProducts.forEach(product => {
        if (product.supplierCode) {
          productsBySupplierCode.set(product.supplierCode, product);
        }
      });
      
      // Procesar cada actualización de producto
      for (const update of productUpdates) {
        const { supplierCode, packCost } = update;
        
        if (!supplierCode) {
          results.errors.push({
            supplierCode: 'desconocido',
            message: 'Código de proveedor no proporcionado',
            details: 'El código de proveedor es requerido para actualizar el producto'
          });
          continue;
        }
        
        if (typeof packCost !== 'number' || isNaN(packCost)) {
          results.errors.push({
            supplierCode,
            message: 'Costo inválido',
            details: `El costo proporcionado (${packCost}) no es un número válido`
          });
          continue;
        }

        if (packCost < 0) {
          results.errors.push({
            supplierCode,
            message: 'Costo inválido',
            details: 'El costo no puede ser negativo'
          });
          continue;
        }
        
        const product = productsBySupplierCode.get(supplierCode);
        
        if (!product) {
          results.errors.push({
            supplierCode,
            message: 'Producto no encontrado',
            details: 'No se encontró ningún producto con este código de proveedor'
          });
          continue;
        }
        
        try {
          // Obtener los valores actuales del producto
          const ivaRate = parseFloat(product.iva?.toString() || "21");
          const shippingRate = parseFloat(product.shipping?.toString() || "0");
          const profitRate = parseFloat(product.profit?.toString() || "55");
          const wholesaleProfitRate = parseFloat(product.wholesaleProfit?.toString() || "35");

// Si el producto se compra por bulto, calcular el costo unitario
const unitsPerPack = parseFloat(product.unitsPerPack?.toString() || "1");
const unitCost = unitsPerPack > 0 ? packCost / unitsPerPack : packCost;

// Preparar datos de actualización
const updateData: any = {
  cost: unitCost.toString(),
  packCost: packCost.toString(),
  lastUpdated: new Date()
};

          // Solo actualizar precios si no se debe mantener los actuales
          if (!keepCurrentPrices) {
            // Calcular nuevo precio minorista partiendo del costo unitario
            const costWithIva = unitCost * (1 + (ivaRate / 100));
            const costWithShipping = costWithIva * (1 + (shippingRate / 100));
            const newPrice = Math.round(costWithShipping * (1 + (profitRate / 100)) * 100) / 100;

            // Calcular nuevo precio mayorista
            const newWholesalePrice = Math.round(costWithShipping * (1 + (wholesaleProfitRate / 100)) * 100) / 100;
            
            updateData.price = newPrice.toString();
            updateData.wholesalePrice = newWholesalePrice.toString();
          }
          
          // Actualizar el producto
          const updatedProduct = await storage.updateProduct(product.id, updateData);
          results.updatedProducts.push(updatedProduct);
          results.success++;
          
        } catch (error) {
          results.errors.push({
            supplierCode,
            message: 'Error al actualizar producto',
            details: (error as Error).message
          });
        }
      }
      
      res.json({
        message: `Se actualizaron ${results.success} productos. Hubo ${results.errors.length} errores.`,
        results
      });
      
    } catch (error) {
      console.error('Error al actualizar costos por archivo:', error);
      res.status(500).json({ 
        error: 'Error al actualizar costos de productos', 
        message: (error as Error).message 
      });
    }
  });

  // Actualización de costos mediante scraping
  app.post('/api/products/update-cost-by-scrape', async (req, res) => {
    try {
      const {
        supplierId,
        url,
        productSelector,
        codeSelector,
        priceSelector,
        keepCurrentPrices = false,
      } = req.body;

      if (!url || !productSelector || !codeSelector || !priceSelector) {
        return res.status(400).json({
          error: 'Faltan parámetros para realizar el scraping',
        });
      }

      const productUpdates = await scrapePrices(
        url,
        productSelector,
        codeSelector,
        priceSelector,
      );

      const results = {
        success: 0,
        errors: [] as Array<{ supplierCode: string; message: string; details?: string }>,
        updatedProducts: [] as any[],
      };

      let allProducts = await storage.getAllProducts();

      if (supplierId) {
        allProducts = allProducts.filter(p => p.supplierId === supplierId);
      }

      const productsBySupplierCode = new Map<string, any>();
      allProducts.forEach(product => {
        if (product.supplierCode) {
          productsBySupplierCode.set(product.supplierCode, product);
        }
      });

      for (const update of productUpdates) {
        const { supplierCode, packCost } = update;

        if (!supplierCode) {
          results.errors.push({
            supplierCode: 'desconocido',
            message: 'Código de proveedor no proporcionado',
            details: 'El código de proveedor es requerido para actualizar el producto',
          });
          continue;
        }

        if (typeof packCost !== 'number' || isNaN(packCost)) {
          results.errors.push({
            supplierCode,
            message: 'Costo inválido',
            details: `El costo proporcionado (${packCost}) no es un número válido`,
          });
          continue;
        }

        if (packCost < 0) {
          results.errors.push({
            supplierCode,
            message: 'Costo inválido',
            details: 'El costo no puede ser negativo',
          });
          continue;
        }

        const product = productsBySupplierCode.get(supplierCode);

        if (!product) {
          results.errors.push({
            supplierCode,
            message: 'Producto no encontrado',
            details: 'No se encontró ningún producto con este código de proveedor',
          });
          continue;
        }

        try {
          const ivaRate = parseFloat(product.iva?.toString() || '21');
          const shippingRate = parseFloat(product.shipping?.toString() || '0');
          const profitRate = parseFloat(product.profit?.toString() || '55');
          const wholesaleProfitRate = parseFloat(product.wholesaleProfit?.toString() || '35');

          const unitsPerPack = parseFloat(product.unitsPerPack?.toString() || '1');
          const unitCost = unitsPerPack > 0 ? packCost / unitsPerPack : packCost;

          const updateData: any = {
            cost: unitCost.toString(),
            packCost: packCost.toString(),
            lastUpdated: new Date(),
          };

          if (!keepCurrentPrices) {
            const costWithIva = unitCost * (1 + ivaRate / 100);
            const costWithShipping = costWithIva * (1 + shippingRate / 100);
            const newPrice = Math.round(costWithShipping * (1 + profitRate / 100) * 100) / 100;
            const newWholesalePrice = Math.round(costWithShipping * (1 + wholesaleProfitRate / 100) * 100) / 100;

            updateData.price = newPrice.toString();
            updateData.wholesalePrice = newWholesalePrice.toString();
          }

          const updatedProduct = await storage.updateProduct(product.id, updateData);
          results.updatedProducts.push(updatedProduct);
          results.success++;
        } catch (error) {
          results.errors.push({
            supplierCode,
            message: 'Error al actualizar producto',
            details: (error as Error).message,
          });
        }
      }

      res.json({
        message: `Se actualizaron ${results.success} productos. Hubo ${results.errors.length} errores.`,
        results,
      });
    } catch (error) {
      console.error('Error al actualizar costos por scraping:', error);
      res.status(500).json({
        error: 'Error al actualizar costos mediante scraping',
        message: (error as Error).message,
      });
    }
  });

  // Bank Accounts endpoints
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await getBankAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cuentas bancarias", error: (error as Error).message });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      const account = await createBankAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Error al crear cuenta bancaria", error: (error as Error).message });
    }
  });

  app.put("/api/bank-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await updateBankAccount(id, req.body);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar cuenta bancaria", error: (error as Error).message });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteBankAccount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar cuenta bancaria", error: (error as Error).message });
    }
  });

  // Production Orders endpoints
  app.get("/api/production-orders", async (req, res) => {
    try {
      const orders = await getProductionOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener órdenes de producción", error: (error as Error).message });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      const order = await createProductionOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Error al crear orden de producción", error: (error as Error).message });
    }
  });

  app.put("/api/production-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await updateProductionOrder(id, req.body);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar orden de producción", error: (error as Error).message });
    }
  });

  app.delete("/api/production-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteProductionOrder(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar orden de producción", error: (error as Error).message });
    }
  });

  // AFIP integration endpoints
  app.get("/api/afip/status", async (_req, res) => {
    try {
      const status = await checkAfipStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Error consultando AFIP", error: (error as Error).message });
    }
  });

  app.post("/api/afip/invoices", async (req, res) => {
    try {
      const result = await createAfipInvoice(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Error enviando factura a AFIP", error: (error as Error).message });
    }
  });

  // Endpoint para renovar la sesión
  app.post("/api/refresh-session", async (req, res) => {
    try {
      if (!req.session.passport?.user) {
        return res.status(401).json({ 
          code: "SESSION_EXPIRED",
          message: "No hay sesión activa" 
        });
      }

      // Verificar si el usuario existe
      const user = await storage.getUser(req.session.passport.user);
      if (!user) {
        return res.status(401).json({ 
          code: "USER_NOT_FOUND",
          message: "Usuario no encontrado" 
        });
      }

      // Renovar la sesión
      req.session.touch();
      
      return res.status(200).json({ 
        message: "Sesión renovada exitosamente",
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error al renovar la sesión:", error);
      return res.status(500).json({ 
        code: "INTERNAL_ERROR",
        message: "Error al renovar la sesión" 
      });
    }
  });

  // Quotation endpoints
  app.post("/api/quotations", async (req, res) => {
    const { clientId, dateValidUntil, items, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Calcular el total del presupuesto
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

      // Crear el presupuesto
      const [quotation] = await db.insert(quotations).values({
        clientId: Number(clientId),
        dateValidUntil: new Date(dateValidUntil),
        status: "pending",
        totalAmount: totalAmount.toString(),
        notes,
        createdBy: userId,
      }).returning();

      // Agregar los items del presupuesto
      const quotationItemsData = items.map((item: any) => ({
        quotationId: quotation.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString(),
      }));

      await db.insert(quotationItems).values(quotationItemsData);

      return res.status(201).json({ success: true, quotation });
    } catch (error) {
      console.error("Error creating quotation:", error);
      return res.status(500).json({ error: "Failed to create quotation" });
    }
  });

  app.get("/api/quotations", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const quotationList = await db.select().from(quotations).orderBy(quotations.dateCreated);
      return res.json(quotationList);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      return res.status(500).json({ error: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    try {
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, parseInt(id)));
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quotation.id));
      return res.json({ ...quotation, items });
    } catch (error) {
      console.error("Error fetching quotation:", error);
      return res.status(500).json({ error: "Failed to fetch quotation" });
    }
  });

  app.put("/api/quotations/:id/status", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = req.body;

    try {
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, parseInt(id)));
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Si el presupuesto es aprobado, crear una factura
      if (status === "approved") {
        const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotation.id));
        
        // Crear la factura
        const [invoice] = await db.insert(sales).values({
          clientId: quotation.clientId,
          date: new Date(),
          totalAmount: quotation.totalAmount,
          status: "pending",
          createdBy: userId,
          quotationId: quotation.id,
        }).returning();

        // Agregar los items a la factura

        const invoiceItemsData = items.map((item) => ({
          saleId: invoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }));

        await db.insert(saleItems).values(invoiceItemsData);
      }

      // Actualizar el estado del presupuesto
      await db
        .update(quotations)
        .set({ status })
        .where(eq(quotations.id, parseInt(id)));

      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating quotation status:", error);
      return res.status(500).json({ error: "Failed to update quotation status" });
    }
  });
  // ... existing code ...
  const server = createServer(app);
  return server;
}
// ... existing code ...
