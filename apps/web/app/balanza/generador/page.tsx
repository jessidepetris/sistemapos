'use client';
import { useState, useEffect } from 'react';

interface Variant {
  id: string;
  name: string;
  parentProduct: { name: string; pricePerKg?: number };
  contentKg: number;
}

export default function Page() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [scheme, setScheme] = useState<'WEIGHT_EMBEDDED' | 'PRICE_EMBEDDED'>('WEIGHT_EMBEDDED');
  const [prefix, setPrefix] = useState(20);
  const [price, setPrice] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [copies, setCopies] = useState(1);
  const [persist, setPersist] = useState(false);
  const [makePdf, setMakePdf] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/pack-variants').then(r => r.json()).then(setVariants);
  }, []);

  const submit = async () => {
    const body: any = { variantId, scheme, prefix, copies, persist, makePdf };
    if (scheme === 'PRICE_EMBEDDED') {
      if (price) body.priceArs = Number(price);
      else if (unitPrice) body.unitPriceArs = Number(unitPrice);
    }
    const res = await fetch('/api/scale-fake/for-variant', { method: 'POST', body: JSON.stringify(body) });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Generador de códigos tipo balanza</h1>
      <div className="space-y-2">
        <select value={variantId} onChange={e => setVariantId(e.target.value)} className="border p-1">
          <option value="">Seleccione variante</option>
          {variants.map(v => (
            <option key={v.id} value={v.id}>{v.parentProduct.name} {v.name} ({v.contentKg}kg)</option>
          ))}
        </select>
        <div>
          <label className="mr-2"><input type="radio" checked={scheme==='WEIGHT_EMBEDDED'} onChange={() => setScheme('WEIGHT_EMBEDDED')} /> Peso embebido</label>
          <label><input type="radio" checked={scheme==='PRICE_EMBEDDED'} onChange={() => setScheme('PRICE_EMBEDDED')} /> Precio embebido</label>
        </div>
        <div>
          <label>Prefijo <input type="number" value={prefix} onChange={e=>setPrefix(Number(e.target.value))} className="border w-16"/></label>
        </div>
        {scheme==='PRICE_EMBEDDED' && (
          <div className="space-x-2">
            <input placeholder="Precio" value={price} onChange={e=>setPrice(e.target.value)} className="border p-1 w-24"/>
            <span>o</span>
            <input placeholder="Precio unitario" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} className="border p-1 w-24"/>
          </div>
        )}
        <div>
          <label>Copias <input type="number" value={copies} min={1} onChange={e=>setCopies(Number(e.target.value))} className="border w-16"/></label>
        </div>
        <div>
          <label><input type="checkbox" checked={persist} onChange={e=>setPersist(e.target.checked)} /> Guardar en variante</label>
        </div>
        <div>
          <label><input type="checkbox" checked={makePdf} onChange={e=>setMakePdf(e.target.checked)} /> Generar PDF</label>
        </div>
        <button onClick={submit} className="bg-blue-600 text-white px-3 py-1 rounded">Generar</button>
      </div>
      {result && (
        <div className="space-y-2">
          <div>Código: {result.ean13}</div>
          {result.pngBase64 && <img src={`data:image/png;base64,${result.pngBase64}`} alt="barcode" />}
          {result.pdfUrl && <a href={result.pdfUrl} target="_blank" className="text-blue-600 underline">Descargar PDF</a>}
        </div>
      )}
    </div>
  );
}
