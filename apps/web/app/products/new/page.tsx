'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CldUploadButton } from 'next-cloudinary';

export default function NewProduct() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: '',
    description: '',
    stock: '',
    minStock: '',
    costARS: '',
    costUSD: '',
    priceARS: '',
    unit: '',
    category: '',
    subcategory: '',
    barcodes: '',
    variants: '',
    isBulk: false,
    isRefrigerated: false,
    requiresLabel: false,
    imageUrl: '',
    isComposite: false,
    kitBarcode: '',
    priceMode: 'FIXED',
  });
  const [components, setComponents] = useState<{ productId: string; quantity: string }[]>([]);

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.replace('/products');
    }
  }, [session, router]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  const addComponent = () => {
    setComponents(prev => [...prev, { productId: '', quantity: '' }]);
  };

  const updateComponent = (idx: number, field: string, value: string) => {
    setComponents(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.isComposite) {
      const body = {
        name: form.name,
        description: form.description,
        kitBarcode: form.kitBarcode || undefined,
        priceMode: form.priceMode,
        priceARS: form.priceMode === 'FIXED' ? Number(form.priceARS) : undefined,
        unit: form.unit,
        category: form.category,
        subcategory: form.subcategory || undefined,
        imageUrl: form.imageUrl || undefined,
        components: components.map(c => ({ componentId: Number(c.productId), quantity: Number(c.quantity) })),
      };
      await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      const body = {
        name: form.name,
        description: form.description,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        costARS: Number(form.costARS),
        costUSD: form.costUSD ? Number(form.costUSD) : undefined,
        priceARS: Number(form.priceARS),
        unit: form.unit,
        category: form.category,
        subcategory: form.subcategory || undefined,
        barcodes: form.barcodes.split(',').map(b => b.trim()).filter(Boolean),
        variants: form.variants ? JSON.parse(form.variants) : undefined,
        isBulk: form.isBulk,
        isRefrigerated: form.isRefrigerated,
        requiresLabel: form.requiresLabel,
        imageUrl: form.imageUrl || undefined,
      };
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    router.push('/products');
  }

  return (
    <form onSubmit={submit} className="p-4 space-y-2">
      <input className="border p-1 w-full" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <textarea className="border p-1 w-full" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
      <input className="border p-1 w-full" name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" type="number" />
      <input className="border p-1 w-full" name="minStock" value={form.minStock} onChange={handleChange} placeholder="Min Stock" type="number" />
      <input className="border p-1 w-full" name="costARS" value={form.costARS} onChange={handleChange} placeholder="Cost ARS" type="number" />
      <input className="border p-1 w-full" name="costUSD" value={form.costUSD} onChange={handleChange} placeholder="Cost USD" type="number" />
      <input className="border p-1 w-full" name="priceARS" value={form.priceARS} onChange={handleChange} placeholder="Price ARS" type="number" />
      <input className="border p-1 w-full" name="unit" value={form.unit} onChange={handleChange} placeholder="Unit" />
      <input className="border p-1 w-full" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
      <input className="border p-1 w-full" name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="Subcategory" />
      <input className="border p-1 w-full" name="barcodes" value={form.barcodes} onChange={handleChange} placeholder="Barcodes (comma separated)" />
      <textarea className="border p-1 w-full" name="variants" value={form.variants} onChange={handleChange} placeholder="Variants (JSON)" />
      <label className="flex items-center space-x-2">
        <input type="checkbox" name="isBulk" checked={form.isBulk} onChange={handleChange} />
        <span>Is Bulk</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" name="isRefrigerated" checked={form.isRefrigerated} onChange={handleChange} />
        <span>Is Refrigerated</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" name="requiresLabel" checked={form.requiresLabel} onChange={handleChange} />
        <span>Requires Label</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" name="isComposite" checked={form.isComposite} onChange={handleChange} />
        <span>Es kit (compuesto)</span>
      </label>
      {form.isComposite && (
        <div className="space-y-2 border p-2">
          <input className="border p-1 w-full" name="kitBarcode" value={form.kitBarcode} onChange={handleChange} placeholder="Kit barcode" />
          <select name="priceMode" value={form.priceMode} onChange={handleChange} className="border p-1 w-full">
            <option value="FIXED">Precio fijo</option>
            <option value="SUM_COMPONENTS">Suma componentes</option>
          </select>
          {components.map((c, idx) => (
            <div key={idx} className="flex space-x-2">
              <input className="border p-1 flex-1" placeholder="Producto ID" value={c.productId} onChange={e => updateComponent(idx, 'productId', e.target.value)} />
              <input className="border p-1 w-24" placeholder="Cant" value={c.quantity} onChange={e => updateComponent(idx, 'quantity', e.target.value)} />
            </div>
          ))}
          <button type="button" className="bg-gray-200 px-2" onClick={addComponent}>Agregar componente</button>
        </div>
      )}
      <CldUploadButton uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!} onUpload={(res: any) => setForm(prev => ({ ...prev, imageUrl: res.info.secure_url }))} />
      {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-32" />}
      <button className="bg-blue-500 text-white px-2 py-1" type="submit">Save</button>
    </form>
  );
}
