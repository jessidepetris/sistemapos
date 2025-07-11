import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { WebAuthProvider } from "@/hooks/use-web-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/lib/protected-route";
import { RouterProvider } from "@/lib/router-provider";
import { useEffect } from "react";
import { QuotationRoutes } from "@/routes";
import QuotationsPage from "@/pages/quotations";

// Admin Panel Pages
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import { POSPage } from "@/pages/pos";
import ProductsPage from "@/pages/products-page";
import CategoriesPage from "@/pages/categories-page";
import SuppliersPage from "@/pages/suppliers";
import CustomersPage from "@/pages/customers";
import AccountsPage from "@/pages/accounts";
import InvoicesPage from "@/pages/invoices";
import OrdersPage from "@/pages/orders";
import CreditNotesPage from "@/pages/credit-notes";
import ReportsPage from "@/pages/reports";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import LogisticsPage from "@/pages/logistics-page";
import PurchasesPage from "@/pages/purchases-page";
import BankAccountsPage from "@/pages/bank-accounts";
import BarcodesPage from "@/pages/barcodes-page";

// Web Catalog Pages
import WebHomePage from "@/pages/web/home-page";
import LoginPage from "@/pages/web/login-page";
import WebProductsPage from "@/pages/web/products-page";
import ProductDetailsPage from "@/pages/web/product-details";
import CartPage from "@/pages/web/cart-page";
import CheckoutPage from "@/pages/web/checkout-page";
import OrderConfirmationPage from "@/pages/web/order-confirmation-page";
import AccountPage from "@/pages/web/account-page";
import WebOrdersPage from "@/pages/web/orders-page";

function AppRoutes() {
  useEffect(() => {
    console.log("[AppRoutes] Component mounted");
    return () => {
      console.log("[AppRoutes] Component unmounted");
    };
  }, []);

  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/quotations">
        <QuotationRoutes />
      </Route>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/pos" component={POSPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/categories" component={CategoriesPage} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/accounts" component={AccountsPage} />
      <ProtectedRoute path="/barcodes" component={BarcodesPage} />
      <ProtectedRoute path="/bank-accounts" component={BankAccountsPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/credit-notes" component={CreditNotesPage} />
      <ProtectedRoute path="/logistics" component={LogisticsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/purchases" component={PurchasesPage} />
      <ProtectedRoute path="/quotations" component={QuotationsPage} />
      
      {/* Web Catalog Routes */}
      <Route path="/web">
        <WebHomePage />
      </Route>
      <Route path="/web/login">
        <LoginPage />
      </Route>
      <Route path="/web/products">
        <WebProductsPage />
      </Route>
      <Route path="/web/products/:productId">
        <ProductDetailsPage />
      </Route>
      <Route path="/web/cart">
        <CartPage />
      </Route>
      <Route path="/web/checkout">
        <CheckoutPage />
      </Route>
      <Route path="/web/order-confirmation/:orderId">
        <OrderConfirmationPage />
      </Route>
      <Route path="/web/account">
        <AccountPage />
      </Route>
      <Route path="/web/orders">
        <WebOrdersPage />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    console.log("[App] Component mounted");
    return () => {
      console.log("[App] Component unmounted");
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient.reactQuery}>
      <AuthProvider>
        <WebAuthProvider>
          <CartProvider>
            <RouterProvider>
              <AppRoutes />
              <Toaster />
            </RouterProvider>
          </CartProvider>
        </WebAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
