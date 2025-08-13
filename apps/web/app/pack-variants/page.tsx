'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Variant {
  id: string;
  name: string;
  contentKg: number;
  fakeScaleBarcode?: string;
  parentProduct: { name: string };
}

export default function PackVariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [result, setResult] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/api/pack-variants').then(r => r.json()).then(setVariants);
  }, []);

  async function generate(id: string) {
    const res = await fetch(`/api/scale-fake/for-variant`, { method: 'POST', body: JSON.stringify({ variantId: id, persist: true }) });
    const data = await res.json();
    setResult(r => ({ ...r, [id]: data.ean13 }));
  }

  async function print(id: string) {
    const body = JSON.stringify({ variants: [{ variantId: id, copies: 1 }] });
    const res = await fetch('/api/labels/pack-variants/print', { method: 'POST', body });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pack Variants</h1>
      <ul>
        {variants.map(v => (
          <li key={v.id} className="mb-2">
            {v.parentProduct.name} {v.name} ({v.contentKg}kg) - {v.fakeScaleBarcode || result[v.id] || '—'}
            <button onClick={() => generate(v.id)} className="ml-2 px-2 py-1 bg-blue-500 text-white">Generar</button>
            <button onClick={() => print(v.id)} className="ml-2 px-2 py-1 bg-green-500 text-white">Imprimir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
