import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; itemId: string } },
) {
  const body = await req.json();
  const res = await fetch(
    `${API_URL}/inventory/${params.id}/update-item/${params.itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    },
  );
  const data = await res.json();
  return NextResponse.json(data);
}

