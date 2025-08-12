'use client';
import { useState } from 'react';

export default function LogisticaReport() {
  const [status, setStatus] = useState('');
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const res = await fetch(`/api/reports/deliveries?${params.toString()}`);
    if (res.headers.get('content-type')?.includes('application/json')) {
      setData(await res.json());
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Informe de Logística</h1>
      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-1">
          <option value="">Todos</option>
          <option value="PREPARANDO">PREPARANDO</option>
          <option value="EN_CAMINO">EN_CAMINO</option>
          <option value="ENTREGADO">ENTREGADO</option>
        </select>
        <button onClick={fetchData} className="px-2 py-1 bg-blue-500 text-white">Filtrar</button>
        {data && (
          <>
            <a href={`/api/reports/deliveries?${new URLSearchParams({ status, format: 'excel' }).toString()}`} className="px-2 py-1 bg-green-500 text-white">Excel</a>
            <a href={`/api/reports/deliveries?${new URLSearchParams({ status, format: 'pdf' }).toString()}`} className="px-2 py-1 bg-red-500 text-white">PDF</a>
          </>
        )}
      </div>
      {data && (
        <table className="min-w-full text-sm">
          <thead><tr><th className="text-left">ID</th><th>Estado</th></tr></thead>
          <tbody>
            {data.deliveries.map((d: any) => (
              <tr key={d.id}><td>{d.id}</td><td>{d.status}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
