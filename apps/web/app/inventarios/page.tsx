"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InventariosPage() {
  const [inventories, setInventories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(setInventories);
  }, []);

  const start = async () => {
    const res = await fetch('/api/inventory/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const inv = await res.json();
    location.href = `/inventarios/${inv.id}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Inventarios</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={start}
      >
        Nuevo inventario
      </button>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          {inventories.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td>
                <Link href={`/inventarios/${inv.id}`}>{inv.id}</Link>
              </td>
              <td>{inv.userId}</td>
              <td>{inv.status}</td>
              <td>{inv.items?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

