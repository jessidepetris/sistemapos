'use client';
import { useEffect, useState } from 'react';

interface OrderItemForm {
  productId: number;
  quantity: number;
  price: number;
  discount: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [total, setTotal] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(setOrders);
  }, []);

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, price: 0, discount: 0 }]);
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = Number(value);
    setItems(newItems);
  };

  const submit = async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId ? Number(clientId) : undefined,
        items,
        total: Number(total),
      }),
    });
    const data = await res.json();
    setOrders([...orders, data]);
    setClientId('');
    setItems([]);
    setTotal('');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Notas de Pedido</h1>
      <div className="space-y-2">
        <input
          placeholder="ID Cliente"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          className="border p-1"
        />
        <input
          placeholder="Total"
          value={total}
          onChange={e => setTotal(e.target.value)}
          className="border p-1"
        />
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
              placeholder="Precio"
              value={item.price}
              onChange={e => updateItem(i, 'price', e.target.value)}
              className="border p-1"
            />
            <input
              placeholder="Desc"
              value={item.discount}
              onChange={e => updateItem(i, 'discount', e.target.value)}
              className="border p-1"
            />
          </div>
        ))}
        <button onClick={addItem} className="border px-2 py-1">Agregar ítem</button>
        <button onClick={submit} className="border px-2 py-1 ml-2">Crear</button>
      </div>
      <ul>
        {orders.map(o => (
          <li key={o.id} className="border-b py-1">
            {o.id} - {o.status} - ${o.total}
          </li>
        ))}
      </ul>
    </div>
  );
}
