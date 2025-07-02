import { storage } from "../storage";

export async function getStats() {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todaySales = (await storage.getAllSales()) || [];
  const todaySalesFiltered = todaySales.filter((sale: any) => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= startOfToday;
  });

  const yesterdaySales = (await storage.getAllSales()) || [];
  const yesterdaySalesFiltered = yesterdaySales.filter((sale: any) => {
    const saleDate = new Date(sale.timestamp);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    return saleDate >= startOfYesterday && saleDate <= endOfYesterday;
  });

  const todayTotal = todaySalesFiltered.reduce((acc: number, sale: any) => acc + parseFloat(sale.total), 0);
  const yesterdayTotal = yesterdaySalesFiltered.reduce((acc: number, sale: any) => acc + parseFloat(sale.total), 0);

  let percentChange = 0;
  let trend = "neutral";

  if (yesterdayTotal > 0) {
    percentChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
    trend = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral";
  } else if (todayTotal > 0) {
    percentChange = 100;
    trend = "up";
  }

  const products = (await storage.getAllProducts()) || [];
  const lowStockProducts = products.filter((product: any) => parseFloat(product.stock) < 10);

  const customers = (await storage.getAllCustomers()) || [];
  const newCustomers = customers;

  return {
    todaySales: {
      total: `$${todayTotal.toFixed(2)}`,
      change: `${Math.abs(percentChange).toFixed(1)}%`,
      trend,
    },
    transactions: {
      count: `${todaySalesFiltered.length}`,
      change:
        yesterdaySalesFiltered.length > 0
          ? `${Math.abs(((todaySalesFiltered.length - yesterdaySalesFiltered.length) / yesterdaySalesFiltered.length) * 100).toFixed(1)}%`
          : "0%",
      trend:
        todaySalesFiltered.length > yesterdaySalesFiltered.length
          ? "up"
          : todaySalesFiltered.length < yesterdaySalesFiltered.length
          ? "down"
          : "neutral",
    },
    lowStock: {
      count: `${lowStockProducts.length}`,
    },
    newCustomers: {
      count: `${newCustomers.length}`,
    },
  };
}
