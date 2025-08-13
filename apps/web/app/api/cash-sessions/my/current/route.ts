import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  const res = await fetch(`${API_URL}/cash-sessions/my/current`, {
    headers:
      userId || role
        ? {
            ...(userId ? { 'x-user-id': String(userId) } : {}),
            ...(role ? { 'x-user-role': String(role) } : {}),
          }
        : undefined,
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
