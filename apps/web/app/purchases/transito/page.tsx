'use client';
import { useEffect, useState } from 'react';

interface PurchaseRow {
  id: string;
  supplier: string;
  expectedDate: string | null;
  daysToDue: number | null;
  total: number;
  status: string;
  receivedPct: number;
}

export default function PurchasesTransitPage() {
  const [summary, setSummary] = useState<any>();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [status, setStatus] = useState('SENT');
  const [supplierId, setSupplierId] = useState('');
  const [lateOnly, setLateOnly] = useState(false);
  const [receiving, setReceiving] = useState<any>(null);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [printLabels, setPrintLabels] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (supplierId) params.set('supplierId', supplierId);
    if (lateOnly) params.set('lateOnly', 'true');
    const list = await fetch(`/api/purchases/transit/list?${params.toString()}`).then(r => r.json());
    setRows(list.items);
    const sum = await fetch('/api/purchases/transit/summary').then(r => r.json());
    setSummary(sum);
  };

  useEffect(() => {
    load();
  }, [status, supplierId, lateOnly]);

  const openReceive = async (id: string) => {
    const p = await fetch(`/api/purchases/${id}`).then(r => r.json());
    setReceiveItems(p.items.map((it: any) => ({ productId: it.productId, receivedQty: it.quantity, unitCost: it.unitCost })));
    setReceiving(id);
  };

  const submitReceive = async () => {
    await fetch(`/api/purchases/${receiving}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: receiveItems, printLabels }),
    });
    setReceiving(null);
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Compras en Tránsito</h1>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-2 border rounded">OC en tránsito: {summary.totalSent}</div>
          <div className="p-2 border rounded">Parciales: {summary.totalPartial}</div>
          <div className="p-2 border rounded">Atrasadas: {summary.lateCount}</div>
          <div className="p-2 border rounded">Próximas: {summary.dueSoonCount}</div>
          <div className="p-2 border rounded">$ en tránsito: {summary.inTransitAmount}</div>
          <div className="p-2 border rounded">Lead esp/real: {summary.avgLeadExpected?.toFixed(1)} / {summary.avgLeadActual?.toFixed(1)}</div>
        </div>
      )}
      <div className="flex space-x-2">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border p-1">
          <option value="SENT">Enviadas</option>
          <option value="RECEIVED_PARTIAL">Parciales</option>
        </select>
        <input placeholder="Proveedor" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="border p-1" />
        <label className="flex items-center space-x-1">
          <input type="checkbox" checked={lateOnly} onChange={e => setLateOnly(e.target.checked)} />
          <span>Atrasadas</span>
        </label>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-1">OC #</th>
            <th className="p-1">Proveedor</th>
            <th className="p-1">Fecha esperada</th>
            <th className="p-1">Días</th>
            <th className="p-1">Total</th>
            <th className="p-1">% Recibido</th>
            <th className="p-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b">
              <td className="p-1">{r.id}</td>
              <td className="p-1">{r.supplier}</td>
              <td className="p-1">{r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : '-'}</td>
              <td className="p-1">{r.daysToDue ?? '-'}</td>
              <td className="p-1">{r.total}</td>
              <td className="p-1">{r.receivedPct.toFixed(0)}%</td>
              <td className="p-1 space-x-1">
                <a href={`/api/purchases/${r.id}/pdf`} target="_blank" className="text-blue-600">PDF</a>
                <button
                  className="text-green-600"
                  onClick={async () => {
                    const d = await fetch(`/api/purchases/${r.id}/whatsapp-link`).then(res => res.json());
                    window.open(d.link, '_blank');
                  }}
                >WA</button>
                <button className="text-orange-600" onClick={() => openReceive(r.id)}>Recibir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {receiving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 space-y-2">
            <h2 className="font-bold mb-2">Recepción</h2>
            {receiveItems.map((it, idx) => (
              <div key={idx} className="flex space-x-2 mb-1">
                <input
                  type="number"
                  value={it.receivedQty}
                  onChange={e => {
                    const val = [...receiveItems];
                    val[idx].receivedQty = Number(e.target.value);
                    setReceiveItems(val);
                  }}
                  className="border p-1 w-20"
                />
                <input
                  type="number"
                  value={it.unitCost}
                  onChange={e => {
                    const val = [...receiveItems];
                    val[idx].unitCost = Number(e.target.value);
                    setReceiveItems(val);
                  }}
                  className="border p-1 w-20"
                />
              </div>
            ))}
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={printLabels} onChange={e => setPrintLabels(e.target.checked)} />
              <span>Imprimir etiquetas</span>
            </label>
            <div className="space-x-2 mt-2">
              <button className="px-2 py-1 border" onClick={submitReceive}>Confirmar</button>
              <button className="px-2 py-1 border" onClick={() => setReceiving(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
