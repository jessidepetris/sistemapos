'use client';

import { useState } from 'react';

interface Suggestion {
  productId: number;
  detectedCost: number;
  currentCost: number;
  difference: number;
  suggestedPrice: number;
}

export default function PriceWatcherPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const runScan = async () => {
    const res = await fetch('/api/price-watcher/run');
    const data = await res.json();
    setSuggestions(data);
  };

  const apply = async () => {
    const toApply = suggestions.filter((s) => selected[s.productId]);
    await fetch('/api/price-watcher/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions: toApply }),
    });
    setSelected({});
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Seguimiento de precios</h1>
      <button
        onClick={runScan}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Ejecutar escaneo de precios
      </button>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Costo actual</th>
                <th>Costo detectado</th>
                <th>% dif</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.productId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selected[s.productId]}
                      onChange={(e) =>
                        setSelected({ ...selected, [s.productId]: e.target.checked })
                      }
                    />
                  </td>
                  <td>{s.productId}</td>
                  <td>{s.currentCost}</td>
                  <td>{s.detectedCost}</td>
                  <td>{s.difference.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={apply}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Aplicar cambios seleccionados
          </button>
        </div>
      )}
    </div>
  );
}

