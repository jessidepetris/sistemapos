import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/cash-sessions/close/${params.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}

