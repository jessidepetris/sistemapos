const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const res = await fetch(`${API_URL}/audit-logs${params ? `?${params}` : ''}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/audit-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.status });
}
