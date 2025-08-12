'use client';
import { useState, useEffect } from 'react';

export default function OpenCashSession() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [openingAmount, setOpeningAmount] = useState('0');

  useEffect(() => {
    fetch('/api/cash-registers').then(r => r.json()).then(setRegisters);
  }, []);

  const submit = async () => {
    await fetch('/api/cash-sessions/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashRegisterId, openingAmount: Number(openingAmount) }),
    });
    window.location.href = '/cajas/sesiones';
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Abrir sesión de caja</h1>
      <select value={cashRegisterId} onChange={e => setCashRegisterId(e.target.value)} className="border p-2 mb-2">
        <option value="">Seleccione caja</option>
        {registers.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      <input value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} className="border p-2 mb-2" />
      <button onClick={submit} className="bg-blue-500 text-white px-4 py-2">Abrir</button>
    </div>
  );
}

