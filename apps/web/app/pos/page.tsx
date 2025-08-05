'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  priceARS: number;
  barcodes: string[];
}

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [saleType, setSaleType] = useState('REMITO_X');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
    fetch('/api/promotions/active').then(r => r.json()).then(setPromotions);
  }, []);

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

  function updateItem(id: number, field: keyof CartItem, value: any) {
    setItems(prev => prev.map(i => i.productId === id ? { ...i, [field]: value } : i));
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
  const change = paidAmount - total;

  async function confirmSale() {
    const body = {
      customerName,
      type: saleType,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount })),
      subtotal,
      discount: generalDiscount,
      total,
      paymentMethod,
      paidAmount,
      change,
    };
    const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaleId(data.id);
    setItems([]);
    setInvoice(null);
  }

  async function generateInvoice() {
    if (!saleId) return;
    const res = await fetch(`/api/invoices/${saleId}`, { method: 'POST' });
    const data = await res.json();
    setInvoice(data);
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block">Cliente</label>
        <input className="border p-1 w-full" value={customerName} onChange={e => setCustomerName(e.target.value)} />
      </div>
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
              <td>{item.name}</td>
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
        <select className="border p-1" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="EFECTIVO">Efectivo</option>
          <option value="DEBITO">Débito</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="MERCADOPAGO">MercadoPago</option>
          <option value="GETNET">Getnet</option>
          <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
          <option value="MIXTO">Mixto</option>
        </select>
      </div>
      <div>
        <label>Monto pagado</label>
        <input type="number" className="border p-1 w-full" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
        <p>Vuelto: {change.toFixed(2)}</p>
      </div>
      <button className="bg-blue-500 text-white px-4 py-2" onClick={confirmSale}>Confirmar venta</button>
      {saleId && (
        <div className="space-y-2">
          <p>Venta creada: {saleId}</p>
          <a className="text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/sales/${saleId}/pdf`} target="_blank" rel="noopener noreferrer">Descargar PDF</a>
          <button className="block bg-green-500 text-white px-4 py-1" onClick={generateInvoice}>Generar Factura</button>
          {invoice && (
            <a className="text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">Descargar Factura</a>
          )}
        </div>
      )}
    </div>
  );
}
