import { QuotationWithItems, QuotationFormData } from "../types/quotation";
import { apiRequest } from "@/lib/queryClient";

// Base URL for API requests. When VITE_API_URL is not provided we
// fallback to "/api" so requests are made relative to the current
// origin (the backend runs on the same server during development).
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const quotationService = {
  async createQuotation(data: QuotationFormData): Promise<QuotationWithItems> {
    const response = await apiRequest("POST", `${API_URL}/quotations`, data);
    return response.json();
  },

  async getQuotations(): Promise<QuotationWithItems[]> {
    const response = await apiRequest("GET", `${API_URL}/quotations`);
    return response.json();
  },

  async getQuotation(id: number): Promise<QuotationWithItems> {
    const response = await apiRequest("GET", `${API_URL}/quotations/${id}`);
    return response.json();
  },

  async updateQuotationStatus(id: number, status: string): Promise<void> {
    await apiRequest("PUT", `${API_URL}/quotations/${id}/status`, { status });
  },
}; 
