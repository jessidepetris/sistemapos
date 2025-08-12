'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function format(num: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(num || 0);
}

export default function CashWidget({ current, lastClosed, role }: { current: any; lastClosed: any; role?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'close' | 'x'>('close');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<{ theoreticalCash: number; difference: number } | null>(null);

  if (role !== 'ADMIN' && role !== 'VENDEDOR') return null;

  const openModal = (m: 'close' | 'x') => {
    setAmount('');
    setPreview(null);
    setMode(m);
    setShowModal(true);
  };

  const calcPreview = async (val: string) => {
    setAmount(val);
    const n = Number(val);
    if (!current?.sessionId || isNaN(n)) return;
    if (mode !== 'close') return;
    const res = await fetch('/api/cash-register/close/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: current.sessionId, closingAmount: n }),
    });
    setPreview(await res.json());
  };

  const confirmClose = async () => {
    const n = Number(amount);
    if (!current?.sessionId || isNaN(n)) return;
    await fetch(`/api/cash-register/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: current.sessionId, closingAmount: n }),
    });
    toast.success('Caja cerrada');
    setShowModal(false);
    window.location.href = `/cajas/sesiones/${current.sessionId}`;
  };

  const confirmX = async () => {
    if (!current?.sessionId) return;
    await fetch(`/api/cash-register/closure-x`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: current.sessionId }),
    });
    toast.success('Arqueo generado');
    setShowModal(false);
  };

  return (
    <div className="mb-4 border p-4 rounded">
      <h2 className="font-bold mb-2">Caja</h2>
      {current?.sessionId ? (
        <div>
          <div>Caja: {current.cashRegister.name}</div>
          <div>Abierta: {new Date(current.openingDate).toLocaleString()}</div>
          <div>Efectivo teórico: {format(current.theoreticalCash)}</div>
          <div className="my-2 flex flex-wrap gap-2">
            {Object.entries(current.byMethod || {}).map(([k, v]) => (
              <span key={k} className="px-2 py-1 bg-gray-200 rounded text-sm">
                {k.slice(0,2)}: {format(v as number)}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Link href={`/cajas/sesiones/${current.sessionId}`} className="bg-blue-500 text-white px-3 py-1 rounded">Ir a la sesión</Link>
            <button onClick={() => openModal('close')} className="bg-green-600 text-white px-3 py-1 rounded">Cerrar caja</button>
            <button onClick={() => openModal('x')} className="bg-yellow-600 text-white px-3 py-1 rounded">Arqueo X</button>
          </div>
        </div>
      ) : (
        <div>
          <p>No tenés una caja abierta</p>
          {role === 'ADMIN' || role === 'VENDEDOR' ? (
            <Link href="/cajas/sesiones/nueva" className="text-blue-600 underline">Abrir caja</Link>
          ) : null}
          {lastClosed?.sessionId && (
            <div className="mt-2 text-sm">
              <div>Última caja cerrada: {new Date(lastClosed.closingDate).toLocaleString()}</div>
              <div>
                Diferencia: <span className={Number(lastClosed.difference) === 0 ? 'text-green-600' : 'text-red-600'}>{format(Number(lastClosed.difference || 0))}</span>
              </div>
              <Link href={`/cajas/sesiones/${lastClosed.sessionId}`} className="text-blue-600 underline">Ver detalle</Link>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-80">
            <h3 className="font-bold mb-2">{mode === 'close' ? 'Cerrar caja' : 'Arqueo X'}</h3>
            <input
              className="border p-2 w-full mb-2"
              placeholder="Monto contado"
              value={amount}
              onChange={e => calcPreview(e.target.value)}
            />
            {preview && (
              <div className="mb-2 text-sm">
                Teórico: {format(preview.theoreticalCash)}<br />
                Diferencia: {format(preview.difference)}
              </div>
            )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="px-3 py-1">Cancelar</button>
                {mode === 'close' ? (
                  <button onClick={confirmClose} className="bg-green-600 text-white px-3 py-1 rounded">Confirmar cierre</button>
                ) : (
                  <button onClick={confirmX} className="bg-yellow-600 text-white px-3 py-1 rounded">Generar X</button>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
