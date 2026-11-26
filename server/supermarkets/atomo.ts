import type { SupermarketResponse } from './types';
import { parseAtomoProducts, type AtomoPayload } from './atomo-parser';

const ENDPOINT = 'https://atomoconviene.com/atomo-ecommerce/module/ambjolisearch/jolisearch';
const cache = new Map<string, { expires: number; response: SupermarketResponse }>();
const pending = new Map<string, Promise<SupermarketResponse>>();
let nextRequestAt = 0;

export async function searchAtomo(query: string): Promise<SupermarketResponse> {
    const term = query.trim();
    const timestamp = new Date().toISOString();
    if (term.length < 2 || term.length > 120) return { products: [], source: 'atomo', timestamp, error: 'Buscá entre 2 y 120 caracteres.' };
    const key = term.toLocaleLowerCase('es-AR');
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.response;
    if (pending.has(key)) return pending.get(key)!;
    if (pending.size >= 4) return { products: [], source: 'atomo', timestamp, error: 'Átomo está ocupado. Volvé a buscar en unos segundos.' };

    // Reserve the next slot before waiting, including concurrent searches.
    const wait = Math.max(0, nextRequestAt - Date.now());
    nextRequestAt = Date.now() + wait + 1000;
    const task = (async (): Promise<SupermarketResponse> => {
        try {
            if (wait) await new Promise(resolve => setTimeout(resolve, wait));
            const response = await fetch(`${ENDPOINT}?ajax=0&s=${encodeURIComponent(term)}`, {
                headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(7000), cache: 'no-store',
            });
            if (!response.ok) throw new Error('Source unavailable');
            const data: AtomoPayload = await response.json();
            if (!Array.isArray(data.products)) throw new Error('Unexpected source format');
            const checkedAt = new Date().toISOString();
            const products = parseAtomoProducts(data, checkedAt);
            const total = Number(data.pagination?.total_items);
            const result: SupermarketResponse = {
                products, source: 'atomo', timestamp: checkedAt,
                total: Number.isSafeInteger(total) && total >= products.length ? total : products.length,
                truncated: Number.isSafeInteger(total) && total > products.length,
            };
            if (cache.size >= 64) cache.delete(cache.keys().next().value!);
            cache.set(key, { response: result, expires: Date.now() + 5 * 60_000 });
            return result;
        } catch {
            return { products: [], source: 'atomo', timestamp, error: 'No pudimos consultar Átomo online. Volvé a buscar o abrí su tienda.' };
        } finally { pending.delete(key); }
    })();
    pending.set(key, task);
    return task;
}
