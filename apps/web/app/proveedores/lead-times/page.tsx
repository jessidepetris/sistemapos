'use client';
import { useEffect, useState } from 'react';

export default function LeadTimesPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/suppliers/lead-times')
      .then(r => r.json())
      .then(setItems);
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Lead times de proveedores</h1>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Días</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.supplierId}</td>
              <td>{i.leadDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
