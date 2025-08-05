'use client';
import { useEffect, useState } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', cuit: '', email: '', phone: '' });

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(setSuppliers);
  }, []);

  const submit = async () => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSuppliers([...suppliers, data]);
    setForm({ name: '', cuit: '', email: '', phone: '' });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Proveedores</h1>
      <div className="space-y-2">
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="border p-1"
        />
        <input
          placeholder="CUIT"
          value={form.cuit}
          onChange={e => setForm({ ...form, cuit: e.target.value })}
          className="border p-1"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="border p-1"
        />
        <input
          placeholder="Teléfono"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="border p-1"
        />
        <button onClick={submit} className="border px-2 py-1">
          Crear
        </button>
      </div>
      <ul>
        {suppliers.map(s => (
          <li key={s.id} className="border-b py-1">
            {`${s.name} - Deuda: $${s.debt}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
