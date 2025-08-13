import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const res = await fetch(`${API_URL}/scale-plus/parse/${params.code}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
