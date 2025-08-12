'use client';

import { useEffect, useState } from 'react';

interface Delivery {
  id: string;
  quotationId: string;
  status: string;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    fetch('/api/deliveries')
      .then(res => res.json())
      .then(setDeliveries);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status } : d));
  };

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Entregas</h1>
      <ul>
        {deliveries.map(d => (
          <li key={d.id} className="flex items-center space-x-2 border-b py-1">
            <span className="flex-1">{d.quotationId}</span>
            <select
              value={d.status}
              onChange={e => updateStatus(d.id, e.target.value)}
              className="border p-1"
            >
              <option value="PREPARANDO">PREPARANDO</option>
              <option value="EN_CAMINO">EN_CAMINO</option>
              <option value="ENTREGADO">ENTREGADO</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
