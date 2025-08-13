import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_URL}/products/${params.id}/similar`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
