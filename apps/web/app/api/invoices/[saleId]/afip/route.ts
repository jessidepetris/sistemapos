import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { saleId: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/invoices/${params.saleId}/afip`, {
    method: 'POST',
  });
  const data = await res.json();
  return NextResponse.json(data);
}
