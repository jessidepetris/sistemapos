import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(
  req: Request,
  { params }: { params: { clientId: string } },
) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/accounts/${params.clientId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
