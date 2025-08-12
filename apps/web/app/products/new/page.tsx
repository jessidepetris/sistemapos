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
  });

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.replace('/products');
    }
  }, [session, router]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      <CldUploadButton uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!} onUpload={(res: any) => setForm(prev => ({ ...prev, imageUrl: res.info.secure_url }))} />
      {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-32" />}
      <button className="bg-blue-500 text-white px-2 py-1" type="submit">Save</button>
    </form>
  );
}
