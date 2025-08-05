import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const formData = await req.formData();
  formData.append('userId', (session?.user as any)?.id || '');
  formData.append('userEmail', session?.user?.email || '');
  const res = await fetch(`${API_URL}/backups/restore`, {
    method: 'POST',
    body: formData,
  });
  const text = await res.text();
  return new Response(text, { status: res.status });
}

