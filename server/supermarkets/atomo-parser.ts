import type { Product } from './types';
import { classifyProduct } from '../../lib/product-category';

export interface AtomoPayload {
    products?: unknown[];
    pagination?: { total_items?: unknown };
}

function officialUrl(value: unknown): string | undefined {
    if (typeof value !== 'string') return;
    try {
        const url = new URL(value);
        if (url.protocol === 'https:' && url.hostname === 'atomoconviene.com' && !url.username && !url.password && !url.port && url.pathname.startsWith('/atomo-ecommerce/')) return url.href;
    } catch { /* Ignore invalid upstream URLs. */ }
}

export function parseAtomoProducts(data: AtomoPayload, timestamp: string): Product[] {
    const products = new Map<string, Product>();
    for (const raw of data.products || []) {
        if (!raw || typeof raw !== 'object') continue;
        const row = raw as Record<string, unknown>;
        const url = officialUrl(row.url);
        const price = typeof row.price_amount === 'number' ? row.price_amount : Number(row.price_amount);
        if (!url || typeof row.name !== 'string' || !row.name.trim() || !Number.isFinite(price) || price < 100) continue;
        const cover = row.cover as { bySize?: { home_default?: { url?: string } }; medium?: { url?: string } } | undefined;
        const name = row.name.trim();
        const image = officialUrl(cover?.bySize?.home_default?.url || cover?.medium?.url);
        // Source photo 69135 says "Entera" although item 24865 is "Liviana 2%".
        // Verified 2026-11-15: leave that photo unavailable instead of showing another variant.
        const mismatchedPhoto = image && /\/69135-/.test(image);
        products.set(url, {
            id: url, name, price, url, image: mismatchedPhoto ? undefined : image,
            ...classifyProduct(name), store: 'atomo-online', chainId: 'atomo', storeLabel: 'Átomo online',
            storeLocation: 'Tienda online · Envío a domicilio o retiro en Juan M. Estrada 1136, Guaymallén',
            source: 'ONLINE', sourceDate: timestamp, departmentId: '50028', department: 'Guaymallén',
        });
    }
    return [...products.values()];
}
