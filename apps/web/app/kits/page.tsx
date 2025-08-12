import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

async function getKits() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kits`, { cache: 'no-store' });
  return res.json();
}

export default async function KitsPage() {
  const [kits, session] = await Promise.all([
    getKits(),
    getServerSession(authOptions),
  ]);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return <p className="p-4">No autorizado</p>;
  }
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Kits</h1>
      <ul>
        {kits.map((k: any) => (
          <li key={k.id} className="mb-2">
            <div className="font-semibold">{k.name} (stock: {k.stock})</div>
            <ul className="ml-4 list-disc">
              {k.kitItems.map((it: any) => (
                <li key={it.id}>{it.component.name} x{it.quantity}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
