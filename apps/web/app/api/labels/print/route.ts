const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/labels/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const headers = new Headers(res.headers);
  return new Response(res.body, { status: res.status, headers });
}
