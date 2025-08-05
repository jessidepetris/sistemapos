'use client';
import { useEffect, useState } from 'react';

export default function StockReport() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/reports/stock').then(async (res) => {
      if (res.headers.get('content-type')?.includes('application/json')) {
        setData(await res.json());
      }
    });
  }, []);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Informe de Stock</h1>
      <a href="/api/reports/stock?format=excel" className="px-2 py-1 bg-green-500 text-white">Excel</a>
      <a href="/api/reports/stock?format=pdf" className="px-2 py-1 bg-red-500 text-white ml-2">PDF</a>
      {data && (
        <>
          <h2 className="font-semibold">Productos con bajo stock</h2>
          <table className="min-w-full text-sm">
            <thead><tr><th className="text-left">Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
            <tbody>
              {data.lowStock.map((p: any) => (
                <tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{p.minStock}</td></tr>
              ))}
            </tbody>
          </table>
          <p>Valor total de stock: {data.stockValue}</p>
        </>
      )}
    </div>
  );
}
