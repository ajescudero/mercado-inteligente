import { searchProductsWithMapping } from './db';
import { getCatalogMetadata } from './catalog';
import type { Product } from './types';

// Preserve the original list/batch APIs while using the same local SEPA catalog.
export async function searchProduct(
  term: string, lat?: number, lng?: number, maxDistance?: number,
): Promise<{ data: Product[]; source: 'DB'; expandedRadius?: number }> {
  if (typeof term !== 'string' || term.trim().length < 2 || term.length > 120) return { data: [], source: 'DB' };
  const hasLocation = typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === 'number' && Number.isFinite(lng) && Math.abs(lng) <= 180;
  const radius = typeof maxDistance === 'number' && Number.isFinite(maxDistance) ? Math.min(200, Math.max(1, maxDistance)) : 20;
  const rows = searchProductsWithMapping(term, hasLocation ? lat : undefined, hasLocation ? lng : undefined, radius);
  const metadata = getCatalogMetadata();
  return {
    source: 'DB',
    data: rows.map(row => ({ ...row, currency: 'ARS', source: 'SEPA', updated: metadata.sourceDate || undefined })),
  };
}
