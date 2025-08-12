import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import CashWidget from './cash-widget';
import NetMarginWidget from './net-margin-widget';

async function getAlerts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`, { cache: 'no-store' });
  return res.json();
}

async function getCurrent(uid: string, role: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/my/current`, {
    headers: { 'x-user-id': uid, 'x-user-role': role },
    cache: 'no-store',
  });
  return res.json();
}

async function getLastClosed(uid: string, role: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/my/last-closed`, {
    headers: { 'x-user-id': uid, 'x-user-role': role },
    cache: 'no-store',
  });
  return res.json();
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;
  const userId = (session?.user as any)?.id;
  let alerts: any[] = [];
  let current: any = null;
  let lastClosed: any = null;
  if (session && role !== 'CLIENTE') {
    [alerts, current, lastClosed] = await Promise.all([
      getAlerts(),
      userId ? getCurrent(userId, role as string) : Promise.resolve({ sessionId: null }),
      userId ? getLastClosed(userId, role as string) : Promise.resolve({ sessionId: null }),
    ]);
  }
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Dashboard</h1>
      {session && role !== 'CLIENTE' && (
        <>
          <CashWidget current={current} lastClosed={lastClosed} role={role as string} />
          <div className="mt-4 max-w-md"><NetMarginWidget /></div>
        </>
      )}
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
