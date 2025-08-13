'use client';
import { useEffect, useState } from 'react';

export default function ReorderRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/replenishment/rules')
      .then(r => r.json())
      .then(setRules);
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Reglas de reabastecimiento</h1>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Producto</th>
            <th>MinStock</th>
            <th>TargetDays</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id}>
              <td>{r.productId}</td>
              <td>{r.minStock ?? '-'}</td>
              <td>{r.targetDays ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
