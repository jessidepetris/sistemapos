import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.warn('client-log', body);
  return NextResponse.json({ ok: true });
}
