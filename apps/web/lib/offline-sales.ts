import { db, PendingSale } from './db';

async function hash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function queueSale(payload: any) {
  const clientTempId = crypto.randomUUID();
  const createdAt = Date.now();
  await db.pendingSales.put({ clientTempId, createdAt, payload });
  return { clientTempId, createdAt };
}

export async function syncPendingSales() {
  const sale = await db.pendingSales.orderBy('createdAt').first();
  if (!sale) return;
  try {
    const key = await hash(sale.clientTempId + sale.createdAt);
    await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': key,
      },
      body: JSON.stringify(sale.payload),
    });
    await db.pendingSales.delete(sale.clientTempId);
  } catch (e) {
    // ignore and retry later
  }
}

export function pendingSalesCount() {
  return db.pendingSales.count();
}
