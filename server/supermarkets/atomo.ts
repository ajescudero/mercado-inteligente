import * as cheerio from 'cheerio';
import { Product, SupermarketResponse } from './types';
import { parseArgentinePrice, RateLimiter } from './utils';

const ATOMO_API_BASE = 'https://atomoconviene.com/atomo-ecommerce/module/ambjolisearch/jolisearch';
const rateLimiter = new RateLimiter(1); // 1 request per second

interface AtomoResponse {
    rendered_products: string;
}

export async function searchAtomo(query: string): Promise<SupermarketResponse> {
    const timestamp = new Date().toISOString();

    try {
        await rateLimiter.waitIfNeeded();

        console.log(`[Atomo] Searching for: ${query}`);

        // ajax=0 returns a JSON with "rendered_products" HTML string containing all results
        const url = `${ATOMO_API_BASE}?ajax=0&s=${encodeURIComponent(query)}`;
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

        if (!data.rendered_products) {
            console.warn('[Atomo] No rendered_products in response');
            return { products: [], source: 'atomo', timestamp };
        }

        const $ = cheerio.load(data.rendered_products);
        const products: Product[] = [];

        $('.product-miniature').each((_, el) => {
            try {
                const $el = $(el);
                const titleLink = $el.find('.product-title a');
                const name = titleLink.text().trim();
                const link = titleLink.attr('href');
                const priceStr = $el.find('.product-price-and-shipping .price').text().trim();

                // Image: try data-src first (lazyload), then src
                const imgElement = $el.find('.thumbnail img');
                const image = imgElement.attr('data-src') || imgElement.attr('src');

                if (!name || !link || !priceStr) {
                    return;
                }

                const price = parseArgentinePrice(priceStr);

                // Extract category from URL: https://atomoconviene.com/atomo-ecommerce/[category]/[id-name].html
                let category: string | undefined;
                if (link) {
                    try {
                        const urlObj = new URL(link);
                        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                        // pathSegments usually: ['atomo-ecommerce', 'category-slug', 'product-slug.html']
                        if (pathSegments.length >= 2) {
                            const slug = pathSegments[1];
                            category = slug
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize
                        }
                    } catch (e) {
                        // Ignore URL parsing errors
                    }
                }

                if (price && price > 0) {
                    products.push({
                        id: link, // Use URL as ID
                        name,
                        price,
                        image: image || '',
                        store: 'atomo',
                        storeLocation: 'Mendoza',
                        url: link,
                        category
                    });
                }
            } catch (e) {
                console.warn('[Atomo] Failed to parse product:', e);
            }
        });

        // Deduplicate just in case
        const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());

        console.log(`[Atomo] Found ${uniqueProducts.length} products`);

        return {
            products: uniqueProducts,
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
