'use client';
import { useEffect, useState } from 'react';

export default function CuentasReport() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reports/accounts-receivable').then(async (res) => {
      if (res.headers.get('content-type')?.includes('application/json')) {
        setData(await res.json());
      }
    });
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
      <a href="/api/reports/accounts-receivable?format=excel" className="px-2 py-1 bg-green-500 text-white">Excel</a>
      <a href="/api/reports/accounts-receivable?format=pdf" className="px-2 py-1 bg-red-500 text-white ml-2">PDF</a>
      <table className="min-w-full text-sm">
        <thead>
          <tr><th className="text-left">Cliente</th><th>Saldo</th><th>Último pago</th><th>Vencido</th></tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.clientId}><td>{r.clientName}</td><td>{r.balance}</td><td>{r.lastPayment ? new Date(r.lastPayment).toLocaleDateString() : '-'}</td><td>{r.overdue}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
