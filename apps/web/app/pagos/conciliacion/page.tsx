'use client';
import { useEffect, useState } from 'react';

interface Settlement {
  id: string;
  gateway: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  _count?: { records: number };
}

export default function Page() {
  const [items, setItems] = useState<Settlement[]>([]);
  const [gateway, setGateway] = useState('MP');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const load = async () => {
    const params = new URLSearchParams();
    if (gateway) params.set('gateway', gateway);
    const res = await fetch(`/api/settlements?${params.toString()}`);
    const data = await res.json();
    setItems(data);
  };
  useEffect(() => { load(); }, []);
  const run = async () => {
    await fetch('/api/settlements/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateway, from, to }),
    });
    load();
  };
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Conciliación de Pagos</h1>
      <div className="flex gap-2">
        <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="border p-1">
          <option value="MP">Mercado Pago</option>
          <option value="GETNET">Getnet</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-1"/>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-1"/>
        <button onClick={run} className="bg-blue-500 text-white px-3 py-1 rounded">Correr</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b"><th>ID</th><th>Gateway</th><th>Desde</th><th>Hasta</th><th>Status</th><th>Export</th></tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-b">
              <td>{s.id}</td>
              <td>{s.gateway}</td>
              <td>{s.periodStart.substring(0,10)}</td>
              <td>{s.periodEnd.substring(0,10)}</td>
              <td>{s.status}</td>
              <td>
                <a href={`/api/settlements/${s.id}/export`} className="text-blue-600">Excel</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
