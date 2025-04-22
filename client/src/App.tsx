import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { WebAuthProvider } from "@/hooks/use-web-auth";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/lib/protected-route";

// Admin Panel Pages
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import POSPage from "@/pages/pos";
import ProductsPage from "@/pages/products-page";
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

// Web Catalog Pages
import WebHomePage from "@/pages/web/home-page";
import LoginPage from "@/pages/web/login-page";
import WebProductsPage from "@/pages/web/products-page";
import ProductDetailsPage from "@/pages/web/product-details";
import CartPage from "@/pages/web/cart-page";

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/pos" component={POSPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/accounts" component={AccountsPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/credit-notes" component={CreditNotesPage} />
      <ProtectedRoute path="/logistics" component={LogisticsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      
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
      <Route path="/web/cart">
        <CartPage />
      </Route>
      <Route path="/web/checkout">
        {/* Agregar CheckoutPage cuando esté listo */}
        <WebHomePage />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebAuthProvider>
          <CartProvider>
            <Router />
            <Toaster />
          </CartProvider>
        </WebAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
