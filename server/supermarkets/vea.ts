import { Product, SupermarketResponse } from './types';
import { parseArgentinePrice, RateLimiter, cleanQueryForVTEX } from './utils';

const VEA_API_BASE = 'https://www.vea.com.ar/api/catalog_system/pub/products/search';
const rateLimiter = new RateLimiter(1); // 1 request per second

interface VeaProduct {
    productId: string;
    productName: string;
    brand?: string;
    link: string;
    categories?: string[];
    items?: Array<{
        images?: Array<{ imageUrl: string }>;
        sellers?: Array<{
            commertialOffer?: {
                Price: number;
                ListPrice?: number;
                IsAvailable?: boolean;
                AvailableQuantity?: number;
            };
        }>;
    }>;
}

export async function searchVea(query: string): Promise<SupermarketResponse> {
    const timestamp = new Date().toISOString();

    try {
        await rateLimiter.waitIfNeeded();

        const cleanedQuery = cleanQueryForVTEX(query);
        if (!cleanedQuery) return { products: [], source: 'vea', timestamp };

        const url = `${VEA_API_BASE}?ft=${encodeURIComponent(cleanedQuery)}&_from=0&_to=49`;
        console.log(`[Vea] Searching for: "${query}" -> cleaned: "${cleanedQuery}"`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'REST-Range': 'resources=0-49'
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error(`[Vea] HTTP ${response.status} for ${url}. Body: ${errorText.substring(0, 100)}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: VeaProduct[] = await response.json();

        const rawProducts = data.map((item) => {
            const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
            const price = offer?.Price;
            const isAvailable = offer?.IsAvailable;
            const quantity = offer?.AvailableQuantity ?? 0;
            const image = item.items?.[0]?.images?.[0]?.imageUrl;

            if (!price || price <= 50 || !isAvailable || quantity <= 0) {
                return null;
            }

            const categories = item.categories || [];
            const category = categories[0]
                ? categories[0].split('/').filter(Boolean).pop()
                : undefined;

            const product: Product = {
                id: item.productId,
                name: item.productName,
                price: parseArgentinePrice(price),
                brand: item.brand,
                image: image,
                store: 'vea',
                url: `https://www.vea.com.ar${item.link}`,
                category,
                categories,
            };
            return product;
        });

        const products: Product[] = rawProducts.filter((p): p is Product => p !== null);

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
