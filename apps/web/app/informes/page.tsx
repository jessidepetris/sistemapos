'use client';
import Link from 'next/link';

export default function Informes() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Informes</h1>
      <ul className="list-disc pl-4">
        <li><Link href="/informes/ventas">Ventas</Link></li>
        <li><Link href="/informes/cuentas">Cuentas Corrientes</Link></li>
        <li><Link href="/informes/stock">Stock</Link></li>
        <li><Link href="/informes/logistica">Logística</Link></li>
      </ul>
    </div>
  );
}
