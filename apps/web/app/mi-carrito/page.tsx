'use client';

import { useCart } from '../cart-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, clear } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/promotions/active').then(r => r.json()).then(setPromotions);
  }, []);

  function linePromo(item: any) {
    let disc = 0;
    promotions.forEach(p => {
      if (p.productId && p.productId !== item.product.id) return;
      if (p.type === 'por_cantidad' && p.minQuantity && p.discountPercent) {
        if (item.quantity >= p.minQuantity) {
          disc += Number(item.product.priceARS) * item.quantity * (p.discountPercent / 100);
        }
      }
      if (p.type === 'bonificacion' && p.minQuantity && p.bonusQuantity) {
        const groups = Math.floor(item.quantity / p.minQuantity);
        const free = groups * (p.minQuantity - p.bonusQuantity);
        disc += Number(item.product.priceARS) * free;
      }
    });
    return disc;
  }

  const lineSubtotal = items.reduce(
    (sum, i) => sum + Number(i.product.priceARS) * i.quantity - linePromo(i),
    0,
  );
  let promoMonto = 0;
  promotions.forEach(p => {
    if (p.type === 'por_monto' && p.minTotal && p.discountPercent) {
      if (lineSubtotal >= p.minTotal) {
        promoMonto += lineSubtotal * (p.discountPercent / 100);
      }
    }
  });
  const subtotal = lineSubtotal - promoMonto;

  const confirm = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    await fetch('/api/catalog-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: session.user.id,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      }),
    });
    clear();
    router.push('/mis-pedidos');
  };

  return (
    <div>
      <h1>Mi carrito</h1>
      <ul>
        {items.map((i) => (
          <li key={i.product.id}>
            {i.product.name} - {i.product.priceARS}
            <input
              type="number"
              value={i.quantity}
              min={1}
              onChange={(e) => updateQuantity(i.product.id, Number(e.target.value))}
            />
          </li>
        ))}
      </ul>
      <div>Subtotal: {subtotal}</div>
      <button onClick={confirm} disabled={loading || items.length === 0}>
        Confirmar pedido
      </button>
    </div>
  );
}
