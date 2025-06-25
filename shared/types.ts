export type PaymentMethod = 
  | 'cash'           // Efectivo
  | 'transfer'       // Transferencia
  | 'qr'            // QR
  | 'credit_card'   // Tarjeta de crédito
  | 'debit_card'    // Tarjeta de débito
  | 'check'         // Cheque
  | 'current_account'; // Cuenta corriente

export interface PaymentDetails {
  cardType?: 'credit' | 'debit';
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  qrCode?: string;
  bankAccountId?: number;
  mixedPayment?: {
    cash: number;
    transfer: number;
    qr: number;
    credit_card: number;
    debit_card: number;
    check: number;
    current_account: number;
  };
}

export interface Purchase {
  id: number;
  timestamp: Date;
  supplierId: number;
  userId: number;
  total: string;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails | null;
  documentType: string;
  invoiceNumber: string | null;
  status: string;
  notes: string | null;
  items: PurchaseItem[];
}

export interface InsertPurchase {
  supplierId: number;
  userId: number;
  total: number;
  paymentMethod: string;
  paymentDetails?: string | null;
  documentType?: string;
  invoiceNumber?: string | null;
  status?: string;
  notes?: string | null;
  items: {
    productId: number;
    quantity: number;
    unit: string;
    cost: number;
  }[];
}

export interface UpdatePurchase {
  supplierId?: number;
  total?: number;
  paymentMethod?: string;
  paymentDetails?: string | null;
  documentType?: string;
  invoiceNumber?: string | null;
  status?: string;
  notes?: string | null;
  items?: {
    productId: number;
    quantity: number;
    unit: string;
    cost: number;
  }[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: string;
  unit: string;
  cost: string;
  total: string;
  isConversion: boolean;
  conversionFactor: string;
  conversionUnit: string | null;
  conversionBarcode: string | null;
}

export interface InsertPurchaseItem {
  purchaseId: number;
  productId: number;
  quantity: number;
  unit: string;
  cost: number;
  total: number;
  isConversion?: boolean;
  conversionFactor?: number;
  conversionUnit?: string | null;
  conversionBarcode?: string | null;
}

export interface Budget {
  id: number;
  timestamp: Date;
  customerId: number;
  userId: number;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  observations: string;
  validityDays: number;
  status: string;
}

export interface BudgetItem {
  id: number;
  budgetId: number;
  productId: number;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface InsertBudget {
  customerId: number;
  userId: number;
  items: {
    productId: number;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  observations: string;
  validityDays: number;
  status?: string;
} 