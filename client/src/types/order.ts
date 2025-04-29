import { z } from "zod";

export interface OrderItem {
  id: number;
  productId: number;
  orderId: number;
  quantity: string;
  unit: string;
  price: string;
  total: string;
  productName: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  customerId?: number;
  notes?: string;
}

export interface Order {
  id: number;
  timestamp: Date | string;
  customerId: number | null;
  userId: number;
  total: string;
  status: OrderStatus;
  notes: string | null;
  source: 'web' | 'manual';
  deliveryDate: Date | string | null;
  customerData?: string; // JSON string
  items: OrderItem[];
  paymentMethod?: string;
  parsedCustomerData?: CustomerData;
}

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'canceled'
  | 'cancelled';

export const orderItemSchema = z.object({
  productId: z.number(),
  quantity: z.string(),
  unit: z.string(),
  price: z.string(),
  total: z.string(),
  productName: z.string()
});

export const customerDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  notes: z.string().optional()
});

export const orderSchema = z.object({
  customerId: z.number().nullable(),
  userId: z.number(),
  total: z.string(),
  status: z.enum(['pending', 'processing', 'in_transit', 'shipped', 'delivered', 'completed', 'canceled', 'cancelled']),
  notes: z.string().nullable(),
  source: z.enum(['web', 'manual']),
  deliveryDate: z.string().nullable(),
  customerData: z.string().optional(),
  items: z.array(orderItemSchema),
  paymentMethod: z.string().optional()
}); 