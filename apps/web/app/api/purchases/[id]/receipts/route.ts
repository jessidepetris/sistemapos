import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${API_URL}/purchases/${params.id}/receipts`);
  const data = await res.json();
  return NextResponse.json(data);
}
