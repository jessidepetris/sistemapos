'use client';
import { useEffect, useState } from 'react';

interface PurchaseItemForm {
  productId: number;
  quantity: number;
  unitCost: number;
}

function b64toBlob(b64Data: string, contentType = 'application/pdf') {
  const byteCharacters = atob(b64Data);
  const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItemForm[]>([]);
  const [total, setTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [printLabels, setPrintLabels] = useState(false);
  const [payment, setPayment] = useState({ purchaseId: '', amount: '' });

  useEffect(() => {
    fetch('/api/purchases')
      .then(res => res.json())
      .then(setPurchases);
  }, []);

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, unitCost: 0 }]);
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItemForm,
    value: string,
  ) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = Number(value);
    setItems(newItems);
  };

  const submit = async () => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId,
        items,
        total: Number(total),
        notes,
        printLabels,
      }),
    });
    const data = await res.json();
    if (data.labelsPdf) {
      const blob = b64toBlob(data.labelsPdf, 'application/pdf');
      const url = URL.createObjectURL(blob);
      window.open(url);
    }
    setPurchases([...purchases, data]);
    setSupplierId('');
    setItems([]);
    setTotal('');
    setNotes('');
    setPrintLabels(false);
  };

  const submitPayment = async () => {
    await fetch(`/api/purchases/${payment.purchaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(payment.amount) }),
    });
    setPayment({ purchaseId: '', amount: '' });
    const list = await fetch('/api/purchases').then(res => res.json());
    setPurchases(list);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Compras</h1>
      <div className="space-y-2">
        <input
          placeholder="Proveedor ID"
          value={supplierId}
          onChange={e => setSupplierId(e.target.value)}
          className="border p-1"
        />
        <input
          placeholder="Total"
          value={total}
          onChange={e => setTotal(e.target.value)}
          className="border p-1"
        />
        <input
          placeholder="Notas"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="border p-1"
        />
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={printLabels} onChange={e => setPrintLabels(e.target.checked)} />
          <span>Imprimir etiquetas</span>
        </label>
        {items.map((item, i) => (
          <div key={i} className="flex space-x-2">
            <input
              placeholder="Producto"
              value={item.productId}
              onChange={e => updateItem(i, 'productId', e.target.value)}
              className="border p-1"
            />
            <input
              placeholder="Cantidad"
              value={item.quantity}
              onChange={e => updateItem(i, 'quantity', e.target.value)}
              className="border p-1"
            />
            <input
              placeholder="Costo"
              value={item.unitCost}
              onChange={e => updateItem(i, 'unitCost', e.target.value)}
              className="border p-1"
            />
          </div>
        ))}
        <button onClick={addItem} className="border px-2 py-1">
          Agregar ítem
        </button>
        <button onClick={submit} className="border px-2 py-1 ml-2">
          Registrar compra
        </button>
      </div>
      <div className="space-y-2">
        <h2 className="font-bold">Registrar Pago</h2>
        <input
          placeholder="Compra ID"
          value={payment.purchaseId}
          onChange={e => setPayment({ ...payment, purchaseId: e.target.value })}
          className="border p-1"
        />
        <input
          placeholder="Monto"
          value={payment.amount}
          onChange={e => setPayment({ ...payment, amount: e.target.value })}
          className="border p-1"
        />
        <button onClick={submitPayment} className="border px-2 py-1">
          Pagar
        </button>
      </div>
      <ul>
        {purchases.map(p => (
          <li key={p.id} className="border-b py-1 space-y-1">
            <div>{`${p.supplier?.name || p.supplierId} - $${p.total} - Estado: ${p.status}`}</div>
            {p.status === 'DRAFT' && (
              <button
                className="border px-2 py-1 mr-2"
                onClick={async () => {
                  await fetch(`/api/purchases/${p.id}/confirm`, { method: 'POST' });
                  const list = await fetch('/api/purchases').then(r => r.json());
                  setPurchases(list);
                }}
              >
                Confirmar
              </button>
            )}
            <button
              className="border px-2 py-1 mr-2"
              onClick={() => window.open(`/api/purchases/${p.id}/pdf`) }
            >
              PDF
            </button>
            <button
              className="border px-2 py-1 mr-2"
              onClick={async () => {
                const res = await fetch(`/api/purchases/${p.id}/whatsapp-link`);
                const data = await res.json();
                window.open(data.link);
              }}
            >
              WhatsApp
            </button>
            <button
              className="border px-2 py-1"
              onClick={async () => {
                const body = {
                  items: p.items.map((it: any) => ({ productId: it.productId, receivedQty: it.quantity, unitCost: it.unitCost })),
                };
                await fetch(`/api/purchases/${p.id}/receive`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const list = await fetch('/api/purchases').then(r => r.json());
                setPurchases(list);
              }}
            >
              Recibir todo
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
