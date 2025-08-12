import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const res = await fetch(`${API_URL}/products/barcode/${params.code}`, {
    headers: role ? { 'x-user-role': role } : undefined,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
