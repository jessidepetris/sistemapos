export interface CartItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  stockAvailable: number;
  isBulk: boolean;
  isRefrigerated: boolean;
  conversionRates?: any;
  imageUrl: string | null;
  isConversion: boolean;
  conversionFactor: number;
  conversionUnit?: string;
  conversionBarcode?: string;
  currency: "ARS" | "USD";
}

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "transfer" | "check" | "qr" | "mixed";

export interface BankAccount {
  id: number;
  alias: string;
  bankName: string;
  accountNumber: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency: "ARS" | "USD";
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  bankAccountId?: number;
  bankName?: string;
  checkNumber?: string;
  qrCode?: string;
} 
