import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CashSessionsPage() {
  const { data } = useSWR('/api/cash-sessions', fetcher);
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Sesiones de Caja</h1>
      <a href="/cajas/sesiones/nueva" className="text-blue-500">Abrir nueva sesión</a>
      <ul className="mt-4">
        {data?.map((s: any) => (
          <li key={s.id} className="border-b py-2">
            <a href={`/cajas/sesiones/${s.id}`}>{s.cashRegister?.name} - {s.status}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

