import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET() {
  const res = await fetch(`${API_URL}/purchases/transit/summary`);
  const data = await res.json();
  return NextResponse.json(data);
}
