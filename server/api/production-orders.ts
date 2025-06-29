import { storage } from "../storage";
import { z } from "zod";

const productionOrderSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
  unit: z.string(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().nullable().optional()
});

export type ProductionOrderData = z.infer<typeof productionOrderSchema>;

export async function getProductionOrders() {
  return storage.getAllProductionOrders();
}

export async function createProductionOrder(data: ProductionOrderData) {
  const validated = productionOrderSchema.parse(data);
  return storage.createProductionOrder(validated);
}

export async function updateProductionOrder(id: number, data: Partial<ProductionOrderData>) {
  const validated = productionOrderSchema.partial().parse(data);
  return storage.updateProductionOrder(id, validated);
}

export async function deleteProductionOrder(id: number) {
  return storage.deleteProductionOrder(id);
}
