import { NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const qs = new URLSearchParams();
  if (from) qs.append('from', from);
  if (to) qs.append('to', to);
  const res = await fetch(`${API_URL}/cash-register/closures?${qs.toString()}`);
  return NextResponse.json(await res.json());
}
