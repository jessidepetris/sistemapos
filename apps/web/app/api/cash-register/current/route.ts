import { NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export async function GET() {
  const res = await fetch(`${API_URL}/cash-register/current`);
  return NextResponse.json(await res.json());
}
