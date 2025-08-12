import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

async function getAlerts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`, { cache: 'no-store' });
  return res.json();
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const alerts =
    session && session.user.role !== 'CLIENTE'
      ? await getAlerts()
      : [];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Dashboard</h1>
      {alerts.length === 0 ? (
        <div>No hay alertas</div>
      ) : (
        <ul>
          {alerts.map((a: any, idx: number) => (
            <li key={idx} className="mb-2 border p-2 rounded">
              <strong>{a.title}</strong>
              <p className="text-sm">{a.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
