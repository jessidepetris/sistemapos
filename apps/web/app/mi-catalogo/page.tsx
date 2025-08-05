'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../cart-context';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  category: string;
  priceARS: string;
  imageUrl?: string;
}

export default function CatalogPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetch('/api/catalog-products')
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (!category || p.category === category),
  );

  return (
    <div>
      <h1>Catálogo</h1>
      <input
        placeholder="Buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Todas</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <ul>
        {filtered.map((p) => (
          <li key={p.id}>
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} width={50} />}
            <div>{p.name}</div>
            <div>{p.priceARS}</div>
            <button onClick={() => addItem(p)}>Agregar al carrito</button>
          </li>
        ))}
      </ul>
      <Link href="/mi-carrito">Ver carrito</Link>
    </div>
  );
}
