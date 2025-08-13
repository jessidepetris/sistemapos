import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  const { searchParams } = new URL(req.url);
  const fast = searchParams.get('fast');
  const formData = await req.formData();
  const res = await fetch(
    `${API_URL}/importar-productos${fast ? `?fast=${fast}` : ''}`,
    {
      method: 'POST',
      body: formData,
      headers:
        userId || role
          ? {
              ...(userId ? { 'x-user-id': String(userId) } : {}),
              ...(role ? { 'x-user-role': String(role) } : {}),
            }
          : undefined,
    },
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
