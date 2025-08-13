import { NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_URL}/settlements/${params.id}/export`);
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': res.headers.get('content-type') || '',
      'Content-Disposition': res.headers.get('content-disposition') || '',
    },
  });
}
