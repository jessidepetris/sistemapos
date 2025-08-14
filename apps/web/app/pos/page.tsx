'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCatalog } from '../../hooks/useCatalog';
import { queueSale } from '../../lib/offline-sales';
import type { Product } from '../../lib/db';

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  variantId?: string;
  consumption?: { plan: string; packUnits: number; bulkKg: number; mode?: string };
}

interface Promotion {
  id: string;
  type: string;
  productId?: number;
  categoryId?: string;
  minQuantity?: number;
  minTotal?: number;
  discountPercent?: number;
  bonusQuantity?: number;
}

export default function POSPage() {
  const products = useCatalog();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [saleType, setSaleType] = useState('REMITO_X');
  const [payments, setPayments] = useState<{ methodLabel: string; gateway: string; amount: number }[]>([
    { methodLabel: 'EFECTIVO', gateway: 'OFFLINE', amount: 0 },
  ]);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [cashSession, setCashSession] = useState<any | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/cash-sessions?status=ABIERTA')
      .then(r => r.json())
      .then(d => {
        if (!d.length) {
          toast.error('Debe abrir una caja antes de vender');
        } else {
          setCashSession(d[0]);
        }
      });
  }, []);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastType, setLastType] = useState('REMITO_X');
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetch('/api/promotions/active').then(r => r.json()).then(setPromotions);
  }, []);

  useEffect(() => {
    if (/^\d{13}$/.test(query)) {
      fetch(`/api/products/barcode/${query}`).then(async r => {
        if (r.ok) {
          const p = await r.json();
          if (p.variantId) {
            const planRes = await fetch('/api/stock-guard/plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ variantId: p.variantId, qty: 1 }),
            });
            if (!planRes.ok) {
              toast.error('Stock insuficiente');
              setQuery('');
              return;
            }
            const plan = await planRes.json();
            setItems(prev => [...prev, { productId: p.id, name: p.name, quantity: 1, price: Number(p.price), discount: 0, variantId: p.variantId, consumption: { ...plan, mode: p.consumeMode } }]);
          } else if (p.id) {
            addItem(p);
          }
          setQuery('');
        } else {
          // fallback parse
          fetch(`/api/scale-plus/parse/${query}`).then(async res => {
            if (res.ok) {
              const data = await res.json();
              if (data && data.productId && data.weightKg) {
                const prod = products.find(p => p.id === data.productId);
                if (prod) {
                  setItems(prev => [...prev, { productId: prod.id, name: prod.name, quantity: data.weightKg, price: Number(prod.priceARS), discount: 0 }]);
                  setQuery('');
                  return;
                }
              }
            }
            toast.error('Código no encontrado');
            setQuery('');
          });
        }
      });
    }
  }, [query, products]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.barcodes.includes(query)
  );

  function addItem(product: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, price: Number(product.priceARS), discount: 0 }];
    });
    setQuery('');
  }

  async function quickPack() {
    const productId = Number(prompt('ID producto base'));
    const variantId = prompt('ID presentación');
    const qty = Number(prompt('Cantidad a armar'));
    const wastePct = Number(prompt('Merma % (0-1)', '0'));
    const wasteKg = Number(prompt('Merma kg', '0'));
    const wasteReason = prompt('Motivo merma') || undefined;
    if (!productId || !variantId || !qty) return;
    const body = JSON.stringify({ productId, variantId, qty, printLabels: true, addToStock: false, wastePct, wasteKg, wasteReason });
    const res = await fetch('/api/packaging/quick', { method: 'POST', body });
    const data = await res.json();
    if (data.labelsPdf) {
      const url = `data:application/pdf;base64,${data.labelsPdf}`;
      window.open(url);
    }
  }

  async function updateItem(id: number, field: keyof CartItem, value: any) {
    setItems(prev => prev.map(i => i.productId === id ? { ...i, [field]: value } : i));
    const item = items.find(i => i.productId === id);
    if (item?.variantId && field === 'quantity') {
      const planRes = await fetch('/api/stock-guard/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: item.variantId, qty: value }),
      });
      if (!planRes.ok) {
        toast.error('Stock insuficiente');
        return;
      }
      const plan = await planRes.json();
      setItems(prev => prev.map(i => i.productId === id ? { ...i, consumption: { ...plan, mode: i.consumption?.mode } } : i));
    }
  }

  function linePromo(item: CartItem) {
    let disc = 0;
    promotions.forEach(p => {
      if (p.productId && p.productId !== item.productId) return;
      if (p.type === 'por_cantidad' && p.minQuantity && p.discountPercent) {
        if (item.quantity >= p.minQuantity) {
          disc += item.price * item.quantity * (p.discountPercent / 100);
        }
      }
      if (p.type === 'bonificacion' && p.minQuantity && p.bonusQuantity) {
        const groups = Math.floor(item.quantity / p.minQuantity);
        const free = groups * (p.minQuantity - p.bonusQuantity);
        disc += item.price * free;
      }
    });
    return disc;
  }

  const lineSubtotal = items.reduce(
    (sum, i) => sum + i.quantity * i.price - i.discount - linePromo(i),
    0,
  );
  let promoMonto = 0;
  promotions.forEach(p => {
    if (p.type === 'por_monto' && p.minTotal && p.discountPercent) {
      if (lineSubtotal >= p.minTotal) {
        promoMonto += lineSubtotal * (p.discountPercent / 100);
      }
    }
  });
  const subtotal = lineSubtotal - promoMonto;
  const total = subtotal - generalDiscount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const change = totalPaid - total;

  async function confirmSale() {
    const body = {
      customerName,
      type: saleType,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount, variantId: i.variantId })),
      subtotal,
      discount: generalDiscount,
      total,
      payments,
    };
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setSaleId(data.id);
      setLastTotal(total);
      setLastType(saleType);
      data.payments?.forEach((p: any) => {
        if (p.qrOrLink) window.open(p.qrOrLink, '_blank');
      });
      if (autoPrint) {
        window.open(`/api/tickets/${data.id}/print`, '_blank');
      }
      setItems([]);
      setPayments([{ methodLabel: 'EFECTIVO', gateway: 'OFFLINE', amount: 0 }]);
      setInvoice(null);
    } catch (e) {
      await queueSale(body);
      toast.success('Venta guardada offline');
      setItems([]);
      setPayments([{ methodLabel: 'EFECTIVO', gateway: 'OFFLINE', amount: 0 }]);
    }
  }

  async function generateInvoice() {
    if (!saleId) return;
    const res = await fetch(`/api/invoices/${saleId}/afip`, { method: 'POST' });
    const data = await res.json();
    setInvoice(data);
  }

  async function retryInvoice() {
    if (!saleId) return;
    const res = await fetch(`/api/invoices/${saleId}/retry`, { method: 'POST' });
    const data = await res.json();
    setInvoice(data);
  }

  return (
    <div className="p-4 space-y-4">
      {cashSession && (
        <div>
          Caja: {cashSession.cashRegister?.name}{' '}
          <span className="px-2 py-1 text-xs bg-green-200 rounded">{cashSession.status}</span>
        </div>
      )}
      <div>
        <label className="block">Cliente</label>
        <input className="border p-1 w-full" value={customerName} onChange={e => setCustomerName(e.target.value)} />
      </div>
      <button onClick={quickPack} className="px-2 py-1 bg-purple-500 text-white">Armar sobre la marcha</button>
      <div>
        <input className="border p-1 w-full" placeholder="Buscar producto o código" value={query} onChange={e => setQuery(e.target.value)} />
        {query && (
          <div className="border mt-1">
            {filtered.map(p => (
              <div key={p.id} className="p-1 cursor-pointer hover:bg-gray-100" onClick={() => addItem(p)}>
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Desc.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.productId}>
              <td>
                {item.name}
                {item.consumption && (
                  <div className="text-xs text-gray-500">
                    Modo {item.consumption.mode || 'AUTO'} - {
                      item.consumption.plan === 'MIXED'
                        ? `${item.consumption.packUnits} pack + ${item.consumption.bulkKg.toFixed(3)} kg`
                        : item.consumption.plan === 'PACK_ONLY'
                          ? `${item.consumption.packUnits} pack`
                          : `${item.consumption.bulkKg.toFixed(3)} kg`
                    }
                  </div>
                )}
              </td>
              <td><input type="number" value={item.quantity} className="w-16 border" onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))} /></td>
              <td><input type="number" value={item.price} className="w-20 border" onChange={e => updateItem(item.productId, 'price', Number(e.target.value))} /></td>
              <td><input type="number" value={item.discount} className="w-20 border" onChange={e => updateItem(item.productId, 'discount', Number(e.target.value))} /></td>
              <td>{(item.quantity * item.price - item.discount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <label>Descuento general</label>
        <input type="number" className="border p-1 w-full" value={generalDiscount} onChange={e => setGeneralDiscount(Number(e.target.value))} />
      </div>
      <div className="flex space-x-2">
        <select className="border p-1" value={saleType} onChange={e => setSaleType(e.target.value)}>
          <option value="REMITO_X">Remito X</option>
          <option value="FACTURA_C">Factura C</option>
        </select>
      </div>
      <div className="space-y-2">
        {payments.map((p, idx) => (
          <div key={idx} className="flex space-x-2">
            <select
              className="border p-1"
              value={p.methodLabel}
              onChange={e => {
                const val = e.target.value;
                setPayments(prev => prev.map((pay, i) => i === idx ? { ...pay, methodLabel: val, gateway: val === 'MERCADOPAGO' ? 'MP' : val === 'GETNET' ? 'GETNET' : 'OFFLINE' } : pay));
              }}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="MERCADOPAGO">MercadoPago</option>
              <option value="GETNET">Getnet</option>
              <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
            </select>
            <input
              type="number"
              className="border p-1 w-32"
              value={p.amount}
              onChange={e => setPayments(prev => prev.map((pay, i) => i === idx ? { ...pay, amount: Number(e.target.value) } : pay))}
            />
          </div>
        ))}
        <button className="border px-2" onClick={() => setPayments(prev => [...prev, { methodLabel: 'EFECTIVO', gateway: 'OFFLINE', amount: 0 }])}>Agregar pago</button>
        <p>Vuelto: {change.toFixed(2)}</p>
        <label className="inline-flex items-center space-x-2"><input type="checkbox" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} /><span>Imprimir automáticamente</span></label>
      </div>
      <button className="bg-blue-500 text-white px-4 py-2" onClick={confirmSale}>Confirmar venta</button>
      {saleId && (
        <div className="space-y-2">
          <p>Venta creada: {saleId}</p>
          <a
            className="text-blue-600 underline"
            href={`/api/documents/${lastType === 'FACTURA_C' ? 'invoice' : 'remito'}/${saleId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver PDF
          </a>
          <a
            className="text-green-600 underline"
            href={`https://wa.me/?text=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + `/api/documents/${lastType === 'FACTURA_C' ? 'invoice' : 'remito'}/${saleId}/pdf`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Compartir por WhatsApp
          </a>
          <button className="block bg-gray-500 text-white px-4 py-1" onClick={() => window.open(`/api/tickets/${saleId}/print`, '_blank')}>🖨️ Imprimir ticket</button>
          <a className="text-green-600 underline" href={`https://wa.me/?text=${encodeURIComponent(`Gracias por su compra. Total: $${lastTotal.toFixed(2)}. Fecha: ${new Date().toLocaleDateString()}. Comprobante: ${lastType === 'FACTURA_C' ? 'Factura C' : 'Remito X'}.`)}`} target="_blank" rel="noopener noreferrer">📩 Enviar por WhatsApp</a>
          <button className="block bg-green-500 text-white px-4 py-1" onClick={generateInvoice}>Generar Factura</button>
          {invoice && (
            invoice.afipError ? (
              <div className="text-red-600">
                Error AFIP: {invoice.afipError}{' '}
                <button className="underline text-blue-600" onClick={retryInvoice}>Reintentar AFIP</button>
              </div>
            ) : (
              <a className="text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">Descargar Factura</a>
            )
          )}
        </div>
      )}
    </div>
  );
}
