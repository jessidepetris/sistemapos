'use client';
import { useState } from 'react';

interface Suggestion {
  id: string;
  product: { name: string; stock: number };
  suggestedQty: number;
  reason: string;
}

export default function ReabastecimientoPage() {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generate = async () => {
    const res = await fetch('/api/replenishment/run', { method: 'POST' });
    const data = await res.json();
    setBatchId(data.batchId);
    const list = await fetch(`/api/replenishment/${data.batchId}`);
    setSuggestions(await list.json());
  };

  const createDrafts = async () => {
    if (!batchId) return;
    await fetch(`/api/replenishment/${batchId}/create-drafts`, { method: 'POST' });
    alert('Compras borrador creadas');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Reabastecimiento sugerido</h1>
      <button className="btn" onClick={generate}>
        Generar sugerencias
      </button>
      {suggestions.length > 0 && (
        <div>
          <table className="table-auto w-full mt-4">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Sugerido</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(s => (
                <tr key={s.id}>
                  <td>{s.product.name}</td>
                  <td>{s.product.stock}</td>
                  <td>{s.suggestedQty}</td>
                  <td>{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn mt-4" onClick={createDrafts}>
            Crear compras borrador
          </button>
        </div>
      )}
    </div>
  );
}
