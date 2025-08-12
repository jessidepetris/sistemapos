'use client';

import { useEffect, useState } from 'react';

interface Promotion {
  id: string;
  name: string;
  type: string;
  productId?: number;
  categoryId?: string;
  clientType?: string;
  minQuantity?: number;
  minTotal?: number;
  discountPercent?: number;
  bonusQuantity?: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<any>({
    name: '',
    type: 'por_cantidad',
    validFrom: '',
    validTo: '',
  });

  useEffect(() => {
    fetch('/api/promotions').then(r => r.json()).then(setPromotions);
  }, []);

  async function submit() {
    await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const list = await fetch('/api/promotions').then(r => r.json());
    setPromotions(list);
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Promociones</h1>
      <div className="space-y-2">
        <input
          className="border p-1 w-full"
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select
          className="border p-1 w-full"
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
        >
          <option value="por_cantidad">Por cantidad</option>
          <option value="por_monto">Por monto</option>
          <option value="bonificacion">Bonificación</option>
        </select>
        <input
          type="date"
          className="border p-1 w-full"
          value={form.validFrom}
          onChange={e => setForm({ ...form, validFrom: e.target.value })}
        />
        <input
          type="date"
          className="border p-1 w-full"
          value={form.validTo}
          onChange={e => setForm({ ...form, validTo: e.target.value })}
        />
        <button className="bg-blue-500 text-white px-4 py-1" onClick={submit}>
          Crear
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Nombre</th>
            <th>Tipo</th>
            <th>Vigencia</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>
                {new Date(p.validFrom).toLocaleDateString()} -
                {new Date(p.validTo).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
