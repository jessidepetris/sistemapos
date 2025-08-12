import { NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const res = await fetch(`${API_URL}/reports/kardex/export?${searchParams.toString()}`);
  const arrayBuffer = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  return new NextResponse(arrayBuffer, { status: res.status, headers });
}
