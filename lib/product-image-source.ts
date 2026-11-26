import { productImageUrl } from './product-image';

export function matchingImage(data: unknown, ean: string): string | null {
  if (!Array.isArray(data)) return null;
  for (const product of data) {
    for (const sku of Array.isArray(product?.items) ? product.items : []) {
      if (typeof sku?.ean !== 'string' || sku.ean.padStart(14, '0') !== ean.padStart(14, '0')) continue;
      for (const image of Array.isArray(sku.images) ? sku.images : []) {
        try {
          const url = new URL(image.imageUrl);
          if (url.protocol === 'https:' && /(?:^|\.)(?:vteximg\.com\.br|vtexassets\.com)$/.test(url.hostname)) return url.href;
        } catch { /* Ignore malformed image URLs. */ }
      }
    }
  }
  return null;
}

const cache = new Map<string, { expires: number; result: Promise<string | null> }>();
let nextRequestAt = 0;

export async function findRetailerImage(ean: string): Promise<string | null> {
  if (!productImageUrl(ean)) return null;
  const cached = cache.get(ean);
  if (cached && cached.expires > Date.now()) return cached.result;
  const delay = Math.max(0, nextRequestAt - Date.now());
  // Bound both concurrency/queue and requests to the public catalog to one per second.
  if (delay > 20000) return null;
  nextRequestAt = Date.now() + delay + 1000;
  const result = (async () => {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    try {
      const url = new URL('https://www.vea.com.ar/api/catalog_system/pub/products/search');
      url.search = new URLSearchParams({ fq: `alternateIds_Ean:${ean}`, _from: '0', _to: '4' }).toString();
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
      return response.ok ? matchingImage(await response.json(), ean) : null;
    } catch { return null; }
  })();
  if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
  cache.set(ean, { expires: Date.now() + 3600000, result });
  return result;
}
