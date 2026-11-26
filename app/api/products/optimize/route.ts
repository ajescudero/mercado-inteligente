import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProduct, findCatalogEquivalents, getCatalogMetadata } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'La lista no es válida.' }, { status: 400 }); }
  const items = body && typeof body === 'object' && 'items' in body ? body.items : null;
  if (!Array.isArray(items) || !items.length || items.length > 100) {
    return NextResponse.json({ error: 'La lista debe contener entre 1 y 100 productos.' }, { status: 400 });
  }
  try {
    const results = [];
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || item.id.length > 2000 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
        return NextResponse.json({ error: 'Revisá los productos y las cantidades de tu carrito.' }, { status: 400 });
      }
      // Resolve canonical products and prices instead of trusting browser-submitted values.
      const product = getCatalogProduct(item.id);
      if (!product) return NextResponse.json({ error: 'Un producto ya no está en el catálogo. Volvé a buscarlo antes de comparar.' }, { status: 409 });
      results.push({ original: { ...product, quantity: item.quantity }, equivalents: findCatalogEquivalents(product) });
    }
    return NextResponse.json({ results, metadata: getCatalogMetadata() });
  } catch {
    return NextResponse.json({ error: 'No se pudieron comparar los precios. Intentá nuevamente.' }, { status: 500 });
  }
}
