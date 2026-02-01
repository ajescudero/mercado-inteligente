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

    // 2. Query supermarkets in parallel with SEPA database
    const [supermarketProducts, dbResults] = await Promise.all([
        // Query supermarket APIs
        supermarketClient.searchAll(term).catch(error => {
            console.error('[Search] Supermarket API error:', error);
            return [];
        }),
        // Query SEPA database
        Promise.resolve(searchProductsWithMapping(term, lat, lng, maxDistance))
    ]);

    console.log(`[Search] Supermarkets: ${supermarketProducts.length}, SEPA: ${dbResults.length}`);

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

    // 4. Convert SEPA results to Product format
    const sepaResults: Product[] = dbResults.map(item => ({
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
        quantity: item.distance ? `${item.distance.toFixed(1)} km` : "1 un",
        source: 'sepa', // Mark as SEPA data
        updated: undefined // No timestamp for SEPA data
    }));

    // 5. Merge results, prioritizing supermarket data
    let allResults = [...supermarketResults, ...sepaResults];

    // 6. Auto-expand radius if we have location and insufficient results from SEPA
    let usedRadius = maxDistance;
    if (lat !== undefined && lng !== undefined && sepaResults.length < MIN_RESULTS_THRESHOLD && maxDistance) {
        const expandedRadii = [
            Math.min(maxDistance * 2, 50),
            Math.min(maxDistance * 4, 50),
            50
        ].filter(r => r > maxDistance); // Only try radii larger than current

        for (const expandedRadius of expandedRadii) {
            const expandedResults = searchProductsWithMapping(term, lat, lng, expandedRadius);
            if (expandedResults.length >= MIN_RESULTS_THRESHOLD) {
                // Add expanded SEPA results
                const expandedSepaResults: Product[] = expandedResults.map(item => ({
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
                    quantity: item.distance ? `${item.distance.toFixed(1)} km` : "1 un",
                    source: 'sepa',
                    updated: undefined
                }));

                allResults = [...supermarketResults, ...expandedSepaResults];
                usedRadius = expandedRadius;
                break;
            }
        }
    }

    // 7. Sort by price (lowest first)
    allResults.sort((a, b) => a.price - b.price);

    // 8. Update Cache (Only for generic searches)
    if (allResults.length > 0 && lat === undefined) {
        setCachedSearch(normalizedTerm, allResults);
    }

    // Determine source
    const source = supermarketResults.length > 0 && sepaResults.length > 0 ? 'MIXED' :
        supermarketResults.length > 0 ? 'SUPERMARKETS' :
            'DB';

    return {
        data: allResults,
        source,
        expandedRadius: (usedRadius !== maxDistance) ? usedRadius : undefined
    };
}
