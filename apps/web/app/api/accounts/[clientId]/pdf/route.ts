const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(
  _req: Request,
  { params }: { params: { clientId: string } },
) {
  const res = await fetch(`${API_URL}/accounts/${params.clientId}/pdf`);
  const buffer = await res.arrayBuffer();
  return new Response(Buffer.from(buffer), {
    headers: { 'Content-Type': 'application/pdf' },
  });
}
