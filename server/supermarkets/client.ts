import { Product, SupermarketResponse } from './types';
import { SimpleCache } from './utils';
import { searchVea } from './vea';
import { searchAtomo } from './atomo';
import { searchCarrefour } from './carrefour';

const cache = new SimpleCache<Product[]>(5 * 60 * 1000); // 5 minutes TTL

export class SupermarketClient {
    /**
     * Search all supermarkets in parallel
     */
    async searchAll(query: string): Promise<Product[]> {
        const cacheKey = `all:${query.toLowerCase()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            console.log(`[Cache] Hit for query: ${query}`);
            return cached;
        }

        console.log(`[SupermarketClient] Searching all supermarkets for: ${query}`);

        // Query all APIs in parallel
        const results = await Promise.allSettled([
            searchVea(query),
            searchAtomo(query),
            searchCarrefour(query),
        ]);

        // Collect all products from successful responses
        const allProducts: Product[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled') {
                const response = result.value;
                if (response.error) {
                    console.warn(`[${response.source}] Error: ${response.error}`);
                } else {
                    allProducts.push(...response.products);
                }
            } else {
                console.error('[SupermarketClient] Promise rejected:', result.reason);
            }
        }

        // Sort by price (lowest first)
        allProducts.sort((a, b) => a.price - b.price);

        // Cache the results
        cache.set(cacheKey, allProducts);

        console.log(`[SupermarketClient] Total products found: ${allProducts.length}`);

        return allProducts;
    }

    /**
     * Search a specific supermarket
     */
    async search(
        store: 'vea' | 'atomo' | 'carrefour',
        query: string
    ): Promise<SupermarketResponse> {
        const cacheKey = `${store}:${query.toLowerCase()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            console.log(`[Cache] Hit for ${store}:${query}`);
            return {
                products: cached,
                source: store,
                timestamp: new Date().toISOString(),
            };
        }

        let response: SupermarketResponse;

        switch (store) {
            case 'vea':
                response = await searchVea(query);
                break;
            case 'atomo':
                response = await searchAtomo(query);
                break;
            case 'carrefour':
                response = await searchCarrefour(query);
                break;
        }

        if (!response.error) {
            cache.set(cacheKey, response.products);
        }

        return response;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        cache.clear();
        console.log('[SupermarketClient] Cache cleared');
    }
}

// Export singleton instance
export const supermarketClient = new SupermarketClient();
