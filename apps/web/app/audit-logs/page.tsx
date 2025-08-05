import React from 'react';

async function getLogs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
}

export default async function AuditLogsPage() {
  const logs = await getLogs();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Historial de Actividad</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Fecha</th>
            <th className="px-2 py-1 text-left">Usuario</th>
            <th className="px-2 py-1 text-left">Acción</th>
            <th className="px-2 py-1 text-left">Entidad</th>
            <th className="px-2 py-1 text-left">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id} className="border-t">
              <td className="px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-2 py-1">{log.userEmail}</td>
              <td className="px-2 py-1">{log.action}</td>
              <td className="px-2 py-1">{log.entity}</td>
              <td className="px-2 py-1">{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
