'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Movement {
  id: string;
  type: 'CARGO' | 'PAGO';
  amount: string;
  description: string;
  createdAt: string;
}

export default function AccountPage({ params }: { params: { clientId: string } }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/accounts/${params.clientId}`)
      .then(res => res.json())
      .then(data => {
        setMovements(data.movements);
        setBalance(data.balance);
      });
  }, [params.clientId]);

  const addPayment = async () => {
    await fetch(`/api/accounts/${params.clientId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), description }),
    });
    setAmount('');
    setDescription('');
    router.refresh();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Cuenta Corriente Cliente {params.clientId}</h1>
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th className="text-left">Fecha</th>
            <th className="text-left">Tipo</th>
            <th className="text-right">Monto</th>
            <th className="text-left">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(m => (
            <tr key={m.id}>
              <td>{m.createdAt.slice(0,10)}</td>
              <td>{m.type}</td>
              <td className="text-right">${m.amount}</td>
              <td>{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-semibold mb-4">Saldo: ${balance}</p>
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Monto"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border p-1"
        />
        <input
          type="text"
          placeholder="Descripción"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border p-1 flex-1"
        />
        <button onClick={addPayment} className="bg-blue-500 text-white px-3 py-1">Registrar pago</button>
      </div>
      <button
        onClick={() => window.open(`/api/accounts/${params.clientId}/pdf`, '_blank')}
        className="bg-gray-300 px-3 py-1"
      >
        Exportar PDF
      </button>
    </div>
  );
}
