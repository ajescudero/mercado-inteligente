import { Product, SupermarketResponse } from './types';
import { parseArgentinePrice, RateLimiter } from './utils';

const VEA_API_BASE = 'https://www.vea.com.ar/api/catalog_system/pub/products/search';
const rateLimiter = new RateLimiter(1); // 1 request per second

interface VeaProduct {
    productId: string;
    productName: string;
    brand?: string;
    link: string;
    items?: Array<{
        images?: Array<{ imageUrl: string }>;
        sellers?: Array<{
            commertialOffer?: {
                Price: number;
                ListPrice?: number;
            };
        }>;
    }>;
}

export async function searchVea(query: string): Promise<SupermarketResponse> {
    const timestamp = new Date().toISOString();

    try {
        await rateLimiter.waitIfNeeded();

        const url = `${VEA_API_BASE}?ft=${encodeURIComponent(query)}`;
        console.log(`[Vea] Searching for: ${query}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: VeaProduct[] = await response.json();

        const products: Product[] = data
            .map((item) => {
                const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price;
                const image = item.items?.[0]?.images?.[0]?.imageUrl;

                if (!price || price <= 0) {
                    return null;
                }

                return {
                    id: item.productId,
                    name: item.productName,
                    price: parseArgentinePrice(price),
                    brand: item.brand,
                    image: image,
                    store: 'vea' as const,
                    url: `https://www.vea.com.ar${item.link}`,
                };
            })
            .filter((p): p is Product => p !== null);

        console.log(`[Vea] Found ${products.length} products`);

        return {
            products,
            source: 'vea',
            timestamp,
        };
    } catch (error) {
        console.error('[Vea] Search failed:', error);
        return {
            products: [],
            source: 'vea',
            timestamp,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
