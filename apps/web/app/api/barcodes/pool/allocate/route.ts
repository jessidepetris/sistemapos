import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const body = await req.json();
  const res = await fetch(`${process.env.API_URL}/barcodes/pool/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
