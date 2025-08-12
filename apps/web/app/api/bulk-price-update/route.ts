import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(req: Request) {
  const formData = await req.formData();
  const res = await fetch(`${API_URL}/bulk-price-update`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data);
}

