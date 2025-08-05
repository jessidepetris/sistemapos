'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  delivery?: { status: string };
}

export default function MyOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      fetch(`/api/my-orders/${session.user.id}`)
        .then((res) => res.json())
        .then(setOrders);
    }
  }, [session]);

  return (
    <div>
      <h1>Mis pedidos</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.createdAt} - {o.status} - {o.total} -{' '}
            {o.delivery?.status ?? 'PREPARANDO'}
          </li>
        ))}
      </ul>
    </div>
  );
}
