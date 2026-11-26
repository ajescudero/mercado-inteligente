import { NextResponse } from 'next/server';
import { searchAtomo } from '@/server/supermarkets/atomo';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2 || q.length > 120) {
    return NextResponse.json({ products: [], error: 'Buscá entre 2 y 120 caracteres.' }, { status: 400 });
  }
  try {
    const response = await searchAtomo(q);
    return NextResponse.json(response, { status: response.error ? 503 : 200 });
  } catch (error) {
    console.error('Atomo API error:', error);
    return NextResponse.json({ error: 'No pudimos consultar Átomo online. Volvé a buscar.' }, { status: 503 });
  }
}
