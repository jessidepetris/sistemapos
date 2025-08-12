import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  const res = await fetch(`${API_URL}/cash-movements/${params.sessionId}`);
  return NextResponse.json(await res.json());
}

