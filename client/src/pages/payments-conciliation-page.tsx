import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function PaymentsConciliationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [settlements, setSettlements] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch('/api/settlements');
    if (res.ok) {
      const data = await res.json();
      setSettlements(data);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const importCsv = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('gateway', 'MP');
    await fetch('/api/settlements/import-csv', {
      method: 'POST',
      body: form,
    });
    setFile(null);
    await load();
  };

  const match = async (id: string) => {
    await fetch(`/api/settlements/${id}/match`, { method: 'POST' });
    await load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Conciliación de Pagos</h1>
      <div className="flex items-center space-x-2">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={importCsv} disabled={!file}>Importar CSV</Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">ID</th>
            <th className="text-left">Gateway</th>
            <th className="text-left">Periodo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((s) => (
            <tr key={s.id} className="border-b">
              <td>{s.id}</td>
              <td>{s.gateway}</td>
              <td>{new Date(s.periodStart).toLocaleDateString()}</td>
              <td><Button variant="outline" onClick={() => match(s.id)}>Match</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
