import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function PATCH(
  req: Request,
  { params }: { params: { batchId: string } },
) {
  const body = await req.json();
  const res = await fetch(
    `${API_URL}/replenishment/${params.batchId}/override`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  return NextResponse.json(data);
}
