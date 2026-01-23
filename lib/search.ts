import { getCachedSearch, setCachedSearch } from "./db";
import { Product } from "./types";

const SIX_HOURS = 6 * 60 * 60 * 1000;

// Mock "Internet Search" - simulates finding products
async function mockInternetSearch(term: string): Promise<Product[]> {
    console.log(`🌍 Searching internet for: ${term}...`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate fake results based on the term
    const brands = ["La Serenísima", "Coto Brand", "Arcor", "Great Value"];
    const stores = ["Coto", "Jumbo", "Carrefour", "Dia%"];

    return Array.from({ length: 4 }).map((_, i) => ({
        id: crypto.randomUUID(),
        name: `${term} ${brands[i]}`,
        brand: brands[i],
        price: Math.floor(Math.random() * 2000) + 500, // Random price 500-2500
        currency: "ARS",
        store: stores[i],
        quantity: "1 un"
    }));
}

export async function searchProduct(term: string): Promise<{ data: Product[], source: 'CACHE' | 'NETWORK' }> {
    const normalizedTerm = term.toLowerCase().trim();

    // 1. Check Cache
    const cached = getCachedSearch(normalizedTerm);

    if (cached) {
        const isFresh = (Date.now() - cached.updatedAt) < SIX_HOURS;
        if (isFresh) {
            console.log(`✅ Returning cached result for: ${term}`);
            return {
                data: JSON.parse(cached.results),
                source: 'CACHE'
            };
        } else {
            console.log(`⚠️ Cache expired for: ${term}`);
        }
    }

    // 2. Perform Network Search
    const results = await mockInternetSearch(term);

    // 3. Update Cache
    setCachedSearch(normalizedTerm, results);

    return {
        data: results,
        source: 'NETWORK'
    };
}
