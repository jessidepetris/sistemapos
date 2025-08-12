'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Variant {
  id: string;
  name: string;
  barcode?: string | null;
  fakeScaleBarcode?: string | null;
  parentProduct: { name: string };
}

export default function BarcodesPage() {
  const { data: session } = useSession();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [count, setCount] = useState(10);

  useEffect(() => {
    fetch('/api/pack-variants')
      .then((r) => r.json())
      .then(setVariants);
  }, []);

  const allocate = async () => {
    await fetch('/api/barcodes/pool/allocate', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
    alert('Códigos generados');
  };

  const assignInternal = async (variantId: string) => {
    await fetch('/api/barcodes/assign', {
      method: 'POST',
      body: JSON.stringify({ variantId, type: 'INTERNAL', print: true }),
    });
    setVariants((v) => v.map((it) => (it.id === variantId ? { ...it, barcode: 'assigned' } : it)));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Códigos de Barras</h1>
      <div className="flex items-center gap-2">
        <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} className="border p-1 w-20" />
        <button onClick={allocate} className="bg-blue-500 text-white px-3 py-1 rounded">Generar Pool</button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr><th>Producto</th><th>Variante</th><th>Código</th><th></th></tr>
        </thead>
        <tbody>
          {variants.map(v => (
            <tr key={v.id} className="border-t">
              <td>{v.parentProduct.name}</td>
              <td>{v.name}</td>
              <td>{v.barcode || v.fakeScaleBarcode || '-'}</td>
              <td>
                {!v.barcode && !v.fakeScaleBarcode && (
                  <button onClick={() => assignInternal(v.id)} className="text-blue-600 underline">Asignar interno</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
