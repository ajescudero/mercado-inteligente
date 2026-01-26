import { getCachedSearch, setCachedSearch, searchProductsInDb } from "./db";
import { Product } from "./types";

const SIX_HOURS = 6 * 60 * 60 * 1000;

export async function searchProduct(
    term: string,
    lat?: number,
    lng?: number
): Promise<{ data: Product[], source: 'CACHE' | 'DB' }> {
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

    // 2. Perform DB Search
    const dbResults = searchProductsInDb(term, lat, lng);

    const results: Product[] = dbResults.map(item => ({
        id: item.id,
        ean: item.ean,
        name: item.name,
        brand: item.brand,
        price: item.price,
        currency: "ARS",
        store: item.store,
        address: item.address,
        locality: item.locality,
        image: item.image,
        quantity: item.distance ? `${item.distance.toFixed(1)} km` : "1 un"
    }));

    // 3. Update Cache (Only for generic searches)
    if (results.length > 0 && lat === undefined) {
        setCachedSearch(normalizedTerm, results);
    }

    return {
        data: results,
        source: 'DB'
    };
}
