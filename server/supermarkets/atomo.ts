import { Product, SupermarketResponse } from './types';
import { parseArgentinePrice, RateLimiter } from './utils';

const ATOMO_API_BASE = 'https://atomoconviene.com/atomo-ecommerce/module/ambjolisearch/jolisearch';
const rateLimiter = new RateLimiter(1); // 1 request per second

interface AtomoProduct {
    pname: string;
    price: string; // Format: "5.038,00 $"
    link: string;
    img?: string;
    cname?: string; // Category name
}

interface AtomoResponse {
    products: AtomoProduct[];
    results: number;
}

export async function searchAtomo(query: string): Promise<SupermarketResponse> {
    const timestamp = new Date().toISOString();

    try {
        await rateLimiter.waitIfNeeded();

        const url = `${ATOMO_API_BASE}?ajax=1&s=${encodeURIComponent(query)}`;
        console.log(`[Atomo] Searching for: ${query}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: AtomoResponse = await response.json();

        const products: Product[] = (data.products || [])
            .map((item) => {
                const price = parseArgentinePrice(item.price);

                if (!price || price <= 0) {
                    return null;
                }

                return {
                    id: item.link,
                    name: item.pname,
                    price,
                    image: item.img,
                    store: 'atomo' as const,
                    storeLocation: 'Mendoza',
                    url: item.link,
                };
            })
            .filter((p): p is Product => p !== null);

        console.log(`[Atomo] Found ${products.length} products`);

        return {
            products,
            source: 'atomo',
            timestamp,
        };
    } catch (error) {
        console.error('[Atomo] Search failed:', error);
        return {
            products: [],
            source: 'atomo',
            timestamp,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
