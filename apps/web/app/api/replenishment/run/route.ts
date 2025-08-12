import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST() {
  const res = await fetch(`${API_URL}/replenishment/run`, {
    method: 'POST',
  });
  const data = await res.json();
  return NextResponse.json(data);
}
