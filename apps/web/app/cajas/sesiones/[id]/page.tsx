'use client';
import useSWR from 'swr';
import { useState } from 'react';
import toast from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CashSessionDetail({ params }: { params: { id: string } }) {
  const { data, mutate } = useSWR(`/api/cash-sessions/${params.id}`, fetcher);
  const [amount, setAmount] = useState('0');
  const [concept, setConcept] = useState('');
  const [countedBy, setCountedBy] = useState('');
  const [notes, setNotes] = useState('');
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  const [counts, setCounts] = useState<{ [k: number]: string }>({});

  const addMovement = async () => {
    await fetch('/api/cash-movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashSessionId: params.id, type: 'EGRESO', paymentMethod: 'EFECTIVO', amount: Number(amount), concept }),
    });
    setAmount('0');
    setConcept('');
    mutate();
  };

  const close = async () => {
    const countsArr = denominations
      .filter(d => Number(counts[d]))
      .map(d => ({ denomination: d, quantity: Number(counts[d]) }));
    await fetch(`/api/cash-sessions/${params.id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counts: countsArr, countedBy, notes }),
    });
    toast.success('Caja cerrada');
    mutate();
  };

  if (!data) return <div className="p-4">Cargando...</div>;
  const byMethod = data.byMethodJson || { sales: {}, expenses: {} };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Detalle de Caja</h1>
      <div className="mb-4">Estado: {data.status}</div>
      <div className="mb-4">Apertura: {data.openingAmount}</div>
      <div className="mb-2">Ventas totales: {data.systemSalesTotal}</div>
      <div className="mb-2">Egresos totales: {data.systemExpensesTotal}</div>
      <div className="mb-4">Diferencia: {data.difference}</div>
      <h2 className="font-bold">Por método</h2>
      <ul className="mb-4">
        {Object.keys(byMethod.sales).map(k => (
          <li key={k}>
            {k}: ventas {byMethod.sales[k]} - egresos {byMethod.expenses?.[k] || 0}
          </li>
        ))}
      </ul>
      <h2 className="font-bold">Movimientos</h2>
      <ul className="mb-4">
        {data.movements?.map((m: any) => (
          <li key={m.id}>{m.type} - {m.amount} - {m.concept}</li>
        ))}
      </ul>
      {data.status === 'ABIERTA' && (
        <div className="mb-4">
          <input value={amount} onChange={e => setAmount(e.target.value)} className="border p-2" />
          <input value={concept} onChange={e => setConcept(e.target.value)} className="border p-2 ml-2" placeholder="Concepto" />
          <button onClick={addMovement} className="bg-blue-500 text-white px-4 py-2 ml-2">Agregar egreso</button>
        </div>
      )}
      {data.status === 'ABIERTA' && (
        <div className="mb-4 border p-2">
          <h3 className="font-bold mb-2">Arqueo</h3>
          <div className="grid grid-cols-3 gap-2">
            {denominations.map(d => (
              <div key={d} className="flex items-center">
                <span className="w-16">{d}</span>
                <input
                  className="border p-1 w-20 ml-2"
                  value={counts[d] || ''}
                  onChange={e => setCounts({ ...counts, [d]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <input
            value={countedBy}
            onChange={e => setCountedBy(e.target.value)}
            className="border p-2 mt-2 w-full"
            placeholder="Contado por"
          />
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="border p-2 mt-2 w-full"
            placeholder="Notas"
          />
          <button onClick={close} className="bg-green-500 text-white px-4 py-2 mt-2">
            Cerrar caja
          </button>
        </div>
      )}
    </div>
  );
}

