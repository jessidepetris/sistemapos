export interface QuotationItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  id: number;
  clientId: number;
  status: "pending" | "approved" | "rejected";
  dateCreated: string;
  dateValidUntil: string;
  totalAmount: number;
  notes?: string;
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[];
}

export interface QuotationFormData {
  clientId: number;
  dateValidUntil: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  notes?: string;
} 
