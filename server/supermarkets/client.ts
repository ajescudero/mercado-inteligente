import { Product, SupermarketResponse } from './types';
import { SimpleCache, calculateStringSimilarity } from './utils';
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
     * Find best matching products for a specific item in all stores
     */
    async findEquivalents(productName: string): Promise<Product[]> {
        console.log(`[SupermarketClient] Finding equivalents for: ${productName}`);

        // Use searchAll to get results from everyone
        const allPotentialMatches = await this.searchAll(productName);

        const stores: Array<'vea' | 'atomo' | 'carrefour'> = ['vea', 'atomo', 'carrefour'];
        const bestMatches: Product[] = [];

        for (const store of stores) {
            const storeProducts = allPotentialMatches.filter(p => p.store === store);
            if (storeProducts.length === 0) continue;

            // Sort by similarity and take the best one
            const scored = storeProducts.map(p => {
                const similarity = calculateStringSimilarity(productName, p.name);

                // Bonus for substring match (case-insensitive)
                const queryLower = productName.toLowerCase();
                const nameLower = p.name.toLowerCase();
                const hasSubstring = nameLower.includes(queryLower);

                // If the product name contains the search query, boost the score
                const finalScore = hasSubstring ? Math.max(similarity, 0.5) : similarity;

                return {
                    product: p,
                    score: finalScore
                };
            });

            scored.sort((a, b) => b.score - a.score);

            // Lowered threshold: accept if similarity > 0.15 OR product name contains search term
            // This is more lenient to ensure we get matches from all stores
            if (scored[0].score > 0.15) {
                bestMatches.push(scored[0].product);
            }
        }

        return bestMatches;
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
