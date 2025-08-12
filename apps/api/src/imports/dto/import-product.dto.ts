export class ImportProductDto {
  supplierCode: string;
  name: string;
  unit?: string;
  price: number;
  iva?: number;
  category?: string;
  subcategory?: string;
  requiresLabel?: boolean;
  ean?: string;
}
