const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(_req: Request, { params }: { params: { saleId: string } }) {
  const res = await fetch(`${API_URL}/tickets/${params.saleId}/print`);
  const html = await res.text();
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

