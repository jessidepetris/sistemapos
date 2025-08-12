'use client';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  priceARS: number;
}

export default function LabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const toggleQuantity = (id: number, value: number) => {
    setQuantities((q) => ({ ...q, [id]: value }));
  };

  const print = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({ productId: Number(id), quantity: Number(qty) }));
    if (!items.length) return;
    const res = await fetch('/api/labels/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, columns }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Imprimir etiquetas</h1>
      <div className="mb-2">
        <label className="mr-2">Etiquetas por fila:</label>
        <select
          value={columns}
          onChange={(e) => setColumns(Number(e.target.value))}
          className="border p-1"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </div>
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th className="text-left">Producto</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              <td>{p.name}</td>
              <td className="text-center">
                <input
                  type="number"
                  min={0}
                  className="w-16 border p-1 text-right"
                  value={quantities[p.id] || 0}
                  onChange={(e) =>
                    toggleQuantity(p.id, parseInt(e.target.value, 10) || 0)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={print}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Imprimir
      </button>
    </div>
  );
}
