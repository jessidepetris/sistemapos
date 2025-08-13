'use client';

import { useEffect, useState } from 'react';

interface ImportLog {
  id: string;
  filename: string;
  createdAt: string;
  totalCreated: number;
  totalUpdated: number;
  totalErrors: number;
  user?: { email?: string };
}

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [user, setUser] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (user) params.append('user', user);
    fetch(`/api/importar-productos/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLogs(data || []));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Historial de importaciones</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex space-x-2 mb-4"
      >
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border p-1"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border p-1"
        />
        <input
          placeholder="Usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border p-1"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Filtrar
        </button>
      </form>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Fecha</th>
            <th className="p-2">Archivo</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Creados</th>
            <th className="p-2">Actualizados</th>
            <th className="p-2">Errores</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="p-2">{l.filename}</td>
              <td className="p-2">{l.user?.email || '-'}</td>
              <td className="p-2">{l.totalCreated}</td>
              <td className="p-2">{l.totalUpdated}</td>
              <td className="p-2">{l.totalErrors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
