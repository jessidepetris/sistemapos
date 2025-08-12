import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(
  _req: Request,
  { params }: { params: { clientId: string } },
) {
  const res = await fetch(`${API_URL}/my-orders/${params.clientId}`);
  const data = await res.json();
  return NextResponse.json(data);
}
