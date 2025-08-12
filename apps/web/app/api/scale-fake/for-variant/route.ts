import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API_URL}/scale-fake/for-variant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
}
