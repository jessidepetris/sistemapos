import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(_req: Request, { params }: { params: { type: string; id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const res = await fetch(`${API_URL}/documents/${params.type}/${params.id}/pdf`, {
    headers: role ? { 'x-user-role': String(role) } : {},
  });
  const buffer = await res.arrayBuffer();
  return new Response(Buffer.from(buffer), {
    headers: { 'Content-Type': 'application/pdf' },
    status: res.status,
  });
}

