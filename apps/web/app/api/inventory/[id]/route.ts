import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_URL}/inventory/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_URL}/inventory/${params.id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data);
}

