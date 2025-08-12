'use client';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CashRegistersPage() {
  const { data, mutate } = useSWR('/api/cash-registers', fetcher);
  const [name, setName] = useState('');

  const create = async () => {
    await fetch('/api/cash-registers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setName('');
    mutate();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Cajas</h1>
      <div className="mb-4">
        <input value={name} onChange={e => setName(e.target.value)} className="border p-2" />
        <button onClick={create} className="bg-blue-500 text-white px-4 py-2 ml-2">Agregar</button>
      </div>
      <ul>
        {data?.map((r: any) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}

