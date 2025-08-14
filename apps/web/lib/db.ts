import Dexie, { Table } from 'dexie';

export interface Product {
  id: number;
  name: string;
  priceARS: number;
  barcodes: string[];
  contentKg?: number;
  isBulk: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  discount: number;
}

export interface PendingSale {
  clientTempId: string;
  createdAt: number;
  payload: any;
}

class AppDB extends Dexie {
  products!: Table<Product, number>;
  promotions!: Table<Promotion, number>;
  pendingSales!: Table<PendingSale, string>;

  constructor() {
    super('pp-db');
    this.version(1).stores({
      products: 'id,name',
      promotions: 'id',
      pendingSales: 'clientTempId,createdAt'
    });
  }
}

export const db = new AppDB();
