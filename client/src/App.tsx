import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
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

function Router() {
  return (
    <Switch>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
