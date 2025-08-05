import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET() {
  const res = await fetch(`${API_URL}/backups`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const res = await fetch(`${API_URL}/backups/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

