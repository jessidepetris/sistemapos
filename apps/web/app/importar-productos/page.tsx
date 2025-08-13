'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface ImportProduct {
  supplierCode: string;
  name: string;
  unit?: string;
  price: number;
  iva?: number;
  category?: string;
  subcategory?: string;
  requiresLabel?: boolean;
}

export default function ImportarProductosPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<(ImportProduct & { errors?: string[] })[]>([]);
  const [fast, setFast] = useState(false);
  const [filename, setFilename] = useState('');
  const [mapping, setMapping] = useState<any | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `/api/importar-productos${fast ? '?fast=1' : ''}`,
      {
        method: 'POST',
        body: formData,
      },
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error('Error al procesar archivo');
      return;
    }
    if (fast) {
      toast.success(
        `Creados: ${data.created || 0}, Actualizados: ${data.updated || 0}, Errores: ${data.failed || data.errors || 0}`,
      );
      setFile(null);
    } else {
      setProducts(data.products || []);
      setFilename(data.filename || '');
      setMapping(data.suggestedMapping || null);
    }
  };

  const updateField = (index: number, field: keyof ImportProduct, value: any) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const confirm = async () => {
    const res = await fetch('/api/importar-productos/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, filename }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Error al confirmar');
      return;
    }
    toast.success(
      `Creados: ${data.created}, Actualizados: ${data.updated}, Errores: ${data.failed}`,
    );
    setProducts([]);
    setFile(null);
    setFilename('');
  };

  if (session?.user.role !== 'ADMIN') {
    return <p>Acceso denegado</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Importar productos</h1>
      <form onSubmit={upload} className="space-y-2">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fast}
            onChange={(e) => setFast(e.target.checked)}
          />
          <span>Importar automáticamente (modo rápido)</span>
        </label>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Subir
        </button>
      </form>
      {mapping && (
        <p className="mt-2 text-sm">
          Columnas detectadas automáticamente: {JSON.stringify(mapping)}
        </p>
      )}
      {products.length > 0 && (
        <div className="mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Código</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Unidad</th>
                <th className="p-2">Precio</th>
                <th className="p-2">IVA</th>
                <th className="p-2">Categoría</th>
                <th className="p-2">Subcategoría</th>
                <th className="p-2">Requiere etiqueta</th>
                <th className="p-2">Errores</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className={`border-b ${p.errors?.length ? 'bg-red-100' : ''}`}>
                  <td className="p-2">
                    <input
                      value={p.supplierCode}
                      onChange={(e) => updateField(i, 'supplierCode', e.target.value)}
                      className="border p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={p.name}
                      onChange={(e) => updateField(i, 'name', e.target.value)}
                      className="border p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={p.unit || ''}
                      onChange={(e) => updateField(i, 'unit', e.target.value)}
                      className="border p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.price}
                      onChange={(e) => updateField(i, 'price', parseFloat(e.target.value))}
                      className="border p-1 w-24"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={p.iva || 0}
                      onChange={(e) => updateField(i, 'iva', parseFloat(e.target.value))}
                      className="border p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={p.category || ''}
                      onChange={(e) => updateField(i, 'category', e.target.value)}
                      className="border p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={p.subcategory || ''}
                      onChange={(e) => updateField(i, 'subcategory', e.target.value)}
                      className="border p-1"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={p.requiresLabel || false}
                      onChange={(e) => updateField(i, 'requiresLabel', e.target.checked)}
                    />
                  </td>
                  <td className="p-2 text-red-600">
                    {p.errors?.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={confirm}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            disabled={products.some((p) => p.errors && p.errors.length > 0)}
          >
            Confirmar importación
          </button>
        </div>
      )}
      <a href="/importar-productos/historial" className="underline block mt-4">
        Ver historial de importaciones
      </a>
    </div>
  );
}
