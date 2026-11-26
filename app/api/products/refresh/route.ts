import { NextResponse } from 'next/server';
import { getCatalogProduct } from '@/lib/catalog';

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Lista inválida.' }, { status: 400 }); }
  if (!Array.isArray(body?.ids) || body.ids.length > 100 || body.ids.some((id: unknown) => typeof id !== 'string' || id.length > 2000)) {
    return NextResponse.json({ error: 'Lista inválida.' }, { status: 400 });
  }
  try {
    const products = body.ids.map((id: string) => ({ id, product: getCatalogProduct(id) || null }));
    return NextResponse.json({ products });
  } catch { return NextResponse.json({ error: 'No se pudo actualizar el carrito.' }, { status: 503 }); }
}
