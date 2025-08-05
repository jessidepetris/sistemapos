'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function BulkPricePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const data = await f.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    setPreview(rows as any[]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/bulk-price-update', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Actualización Masiva de Precios</h1>
      <input type="file" accept=".xlsx" onChange={handleFile} />
      {preview.length > 0 && (
        <div className="my-4">
          <h2 className="font-semibold">Vista previa</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((h) => (
                  <th key={h} className="px-2 py-1 border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.keys(row).map((k) => (
                    <td key={k} className="px-2 py-1 border">{String((row as any)[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Confirmar actualización
      </button>
      {result && (
        <pre className="mt-4 bg-gray-100 p-2 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

