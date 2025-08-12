import { NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const res = await fetch(
    `${API_URL}/reports/settlements/summary?${searchParams.toString()}`,
  );
  const data = await res.json();
  return NextResponse.json(data);
}
