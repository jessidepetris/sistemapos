import { Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import QuotationsPage from "../pages/QuotationsPage";
import QuotationFormPage from "../pages/QuotationFormPage";
import QuotationDetailPage from "../pages/QuotationDetailPage";

export const QuotationRoutes = () => (
  <>
    <ProtectedRoute path="/quotations" component={QuotationsPage} />
    <ProtectedRoute path="/quotations/new" component={QuotationFormPage} />
    <ProtectedRoute path="/quotations/:id" component={QuotationDetailPage} />
  </>
); 