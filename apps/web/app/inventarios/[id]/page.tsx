"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inventory, setInventory] = useState<any>(null);
  const [productId, setProductId] = useState('');
  const [counted, setCounted] = useState('');

  const load = () => {
    fetch(`/api/inventory/${id}`).then((r) => r.json()).then(setInventory);
  };

  useEffect(() => {
    load();
  }, [id]);

  const add = async () => {
    await fetch(`/api/inventory/${id}/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(productId), countedQty: Number(counted) }),
    });
    setProductId('');
    setCounted('');
    load();
  };

  const update = async (itemId: string, qty: number) => {
    await fetch(`/api/inventory/${id}/update-item/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countedQty: qty }),
    });
    load();
  };

  const complete = async () => {
    await fetch(`/api/inventory/${id}/complete`, { method: 'PATCH' });
    router.push('/inventarios');
  };

  const cancel = async () => {
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    router.push('/inventarios');
  };

  if (!inventory) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl">Inventario {inventory.id}</h1>
      <div className="flex gap-2">
        <input
          className="border px-2"
          placeholder="ID producto"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
        <input
          className="border px-2"
          placeholder="Cantidad contada"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
        />
        <button className="bg-green-500 text-white px-3" onClick={add}>
          Agregar
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Sistema</th>
            <th>Contado</th>
            <th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {inventory.items?.map((item: any) => (
            <tr key={item.id} className="border-t">
              <td>{item.productId}</td>
              <td>{item.systemQty}</td>
              <td>
                <input
                  className="w-20 border px-1"
                  type="number"
                  defaultValue={item.countedQty}
                  onBlur={(e) => update(item.id, Number(e.target.value))}
                />
              </td>
              <td className={item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}>
                {item.difference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white" onClick={complete}>
          Completar inventario
        </button>
        <button className="px-4 py-2 bg-gray-400 text-white" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

