const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${API_URL}/backups/${params.id}/download`);
  const headers = new Headers(res.headers);
  return new Response(res.body, { status: res.status, headers });
}

