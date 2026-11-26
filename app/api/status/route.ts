import { withAtomoLocations } from '@/lib/atomo-locations';
import { NextResponse } from 'next/server';
import { getCatalogMetadata } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json(withAtomoLocations(getCatalogMetadata())); }
  catch { return NextResponse.json({ error: 'No se pudo leer la base de precios.' }, { status: 503 }); }
}
