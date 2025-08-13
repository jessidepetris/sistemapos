export class QuickPackDto {
  productId: number;
  variantId: string;
  qty: number;
  addToStock?: boolean;
  printLabels?: boolean;
  wasteKg?: number;
  wastePct?: number;
  wasteReason?: string;
}
