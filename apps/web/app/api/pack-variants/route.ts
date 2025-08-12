import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const res = await fetch(`${API_URL}/pack-variants${productId ? `?productId=${productId}` : ''}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const res = await fetch(`${API_URL}/pack-variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
