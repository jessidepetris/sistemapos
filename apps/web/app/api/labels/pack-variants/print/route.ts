import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${API_URL}/labels/pack-variants/print`, { method: 'POST', body });
  const buf = await res.arrayBuffer();
  return new NextResponse(Buffer.from(buf), {
    status: res.status,
    headers: { 'Content-Type': 'application/pdf' },
  });
}
