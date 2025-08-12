'use client';

import { useEffect, useState } from 'react';

interface BackupRecord {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  userEmail?: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const res = await fetch('/api/backups');
    const data = await res.json();
    setBackups(data);
  };

  useEffect(() => {
    load();
  }, []);

  const createBackup = async () => {
    await fetch('/api/backups', { method: 'POST' });
    await load();
  };

  const restore = async () => {
    if (!file) return;
    if (!confirm('¿Restaurar sistema desde backup? Esto sobrescribirá los datos.'))
      return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/backups/restore', { method: 'POST', body: formData });
    alert('Restauración completada');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Backups</h1>
      <button
        onClick={createBackup}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Crear backup ahora
      </button>

      <h2 className="mt-6 font-semibold">Historial de backups</h2>
      <table className="min-w-full text-sm mt-2">
        <thead>
          <tr>
            <th className="px-2 py-1 border">Fecha</th>
            <th className="px-2 py-1 border">Usuario</th>
            <th className="px-2 py-1 border">Tamaño</th>
            <th className="px-2 py-1 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr key={b.id}>
              <td className="px-2 py-1 border">
                {new Date(b.createdAt).toLocaleString()}
              </td>
              <td className="px-2 py-1 border">{b.userEmail || ''}</td>
              <td className="px-2 py-1 border">
                {(b.size / 1024).toFixed(1)} KB
              </td>
              <td className="px-2 py-1 border">
                <a
                  href={`/api/backups/${b.id}/download`}
                  className="text-blue-600 underline"
                >
                  Descargar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 font-semibold">Restaurar</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={restore}
        className="ml-2 px-4 py-2 bg-red-600 text-white rounded"
      >
        Restaurar
      </button>
    </div>
  );
}

