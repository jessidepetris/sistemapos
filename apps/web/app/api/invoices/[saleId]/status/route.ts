import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { saleId: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/invoices/${params.saleId}/status`);
  const data = await res.json();
  return NextResponse.json(data);
}
