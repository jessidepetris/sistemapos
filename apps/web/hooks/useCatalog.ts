import { useEffect, useState } from 'react';
import axios from 'axios';
import { db, Product } from '../lib/db';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const cached = await db.products.toArray();
      if (cached.length) {
        setProducts(cached);
      }
      try {
        const { data } = await axios.get('/api/public/products');
        await db.products.clear();
        await db.products.bulkPut(data);
        setProducts(data);
        localStorage.setItem('lastSyncAt', new Date().toISOString());
      } catch (e) {
        // offline fallback
      }
    }
    load();
  }, []);

  return products;
}
