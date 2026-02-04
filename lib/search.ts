import { getCachedSearch, setCachedSearch, searchProductsWithMapping } from "./db";
import { Product } from "./types";
import { supermarketClient } from "@/server/supermarkets";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const MIN_RESULTS_THRESHOLD = 10; // Minimum results before auto-expanding

export async function searchProduct(
    term: string,
    lat?: number,
    lng?: number,
    maxDistance?: number
): Promise<{ data: Product[], source: 'CACHE' | 'DB' | 'SUPERMARKETS' | 'MIXED', expandedRadius?: number }> {
    const normalizedTerm = term.toLowerCase().trim();

    // 1. Check Cache (Only if no location, or adjust cache key)
    // For now, let's skip cache if location is provided to ensure fresh sorting
    if (lat === undefined) {
        const cached = getCachedSearch(normalizedTerm);
        if (cached) {
            const isFresh = (Date.now() - cached.updatedAt) < SIX_HOURS;
            if (isFresh) {
                return {
                    data: JSON.parse(cached.results),
                    source: 'CACHE'
                };
            }
        }
    }

    // 2. Query supermarkets in parallel
    const supermarketProducts = await supermarketClient.searchAll(term).catch(error => {
        console.error('[Search] Supermarket API error:', error);
        return [];
    });

    console.log(`[Search] Supermarkets found: ${supermarketProducts.length}`);

    // 3. Convert supermarket products to Product format
    const supermarketResults: Product[] = supermarketProducts.map(p => ({
        id: p.id,
        ean: p.id,
        name: p.name,
        brand: p.brand || '',
        price: p.price,
        currency: "ARS",
        store: p.store.charAt(0).toUpperCase() + p.store.slice(1),
        address: p.storeLocation || '',
        locality: p.storeLocation || 'Online',
        image: p.image || '',
        quantity: '1 un',
        source: p.store, // Add source indicator
        updated: new Date().toISOString() // Add timestamp
    }));

    // 4. Update Cache (Only for generic searches)
    if (supermarketResults.length > 0 && lat === undefined) {
        setCachedSearch(normalizedTerm, supermarketResults);
    }

    return {
        data: supermarketResults,
        source: 'SUPERMARKETS'
    };
}
