import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET() {
  const res = await fetch(`${API_URL}/cash-registers`);
  return NextResponse.json(await res.json());
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/cash-registers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}

