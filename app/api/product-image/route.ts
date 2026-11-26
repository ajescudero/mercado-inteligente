import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productImageUrl } from '@/lib/product-image';
import { findRetailerImage } from '@/lib/product-image-source';

export async function GET(request: Request) {
  const ean = new URL(request.url).searchParams.get('ean') || '';
  if (!productImageUrl(ean) || !db.prepare('SELECT 1 FROM products WHERE ean=? LIMIT 1').get(ean)) {
    return NextResponse.json({ image: null }, { status: 404 });
  }
  const image = await findRetailerImage(ean);
  return NextResponse.json({ image }, { headers: { 'Cache-Control': image ? 'public, max-age=86400' : 'public, max-age=300' } });
}
