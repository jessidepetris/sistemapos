import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API_URL}/sales?${params}`);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
