import { Product, StoreAnalysis, StoreRecommendation, BatchSearchResult } from './types';

/**
 * Analyzes products by store to determine optimal shopping strategy
 */
export function analyzeStoresByProducts(
    searchResults: BatchSearchResult[]
): StoreAnalysis[] {
    const storeMap = new Map<string, {
        products: Array<{ term: string; product: Product }>;
        totalPrice: number;
        distances: number[];
        address?: string;
    }>();

    // Group products by store
    for (const result of searchResults) {
        if (result.status !== 'FOUND' || !result.products.length) continue;

        // For each search term, consider the best product from each store
        const storeProducts = new Map<string, Product>();

        for (const product of result.products) {
            const existing = storeProducts.get(product.store);
            if (!existing || product.price < existing.price) {
                storeProducts.set(product.store, product);
            }
        }

        // Add to store analysis
        for (const [storeName, product] of storeProducts) {
            if (!storeMap.has(storeName)) {
                storeMap.set(storeName, {
                    products: [],
                    totalPrice: 0,
                    distances: [],
                    address: product.address
                });
            }

            const storeData = storeMap.get(storeName)!;
            storeData.products.push({ term: result.term, product });
            storeData.totalPrice += product.price;

            if (product.distance !== undefined) {
                storeData.distances.push(product.distance);
            }
        }
    }

    // Convert to StoreAnalysis array
    const totalItems = searchResults.filter(r => r.status === 'FOUND').length;
    const analyses: StoreAnalysis[] = [];

    for (const [storeName, data] of storeMap) {
        const itemsAvailable = data.products.length;
        const coverage = totalItems > 0 ? (itemsAvailable / totalItems) * 100 : 0;
        const averageDistance = data.distances.length > 0
            ? data.distances.reduce((a, b) => a + b, 0) / data.distances.length
            : undefined;

        const allTerms = searchResults.map(r => r.term);
        const foundTerms = new Set(data.products.map(p => p.term));
        const missingItems = allTerms.filter(term => !foundTerms.has(term));

        analyses.push({
            storeName,
            storeAddress: data.address,
            itemsAvailable,
            totalItems,
            totalPrice: data.totalPrice,
            averageDistance,
            missingItems,
            coverage,
            availableProducts: data.products
        });
    }

    return analyses;
}

/**
 * Finds the optimal shopping strategy (single or multi-store)
 */
export function findOptimalShoppingStrategy(
    analyses: StoreAnalysis[]
): StoreRecommendation {
    if (analyses.length === 0) {
        return {
            primaryStore: {
                storeName: 'N/A',
                itemsAvailable: 0,
                totalItems: 0,
                totalPrice: 0,
                missingItems: [],
                coverage: 0,
                availableProducts: []
            },
            recommendation: 'No se encontraron productos en ninguna tienda',
            isMultiStore: false
        };
    }

    // Sort by coverage first, then by price, then by distance
    const sorted = [...analyses].sort((a, b) => {
        // Primary: coverage (more items = better)
        if (a.coverage !== b.coverage) {
            return b.coverage - a.coverage;
        }

        // Secondary: price (lower = better)
        if (a.totalPrice !== b.totalPrice) {
            return a.totalPrice - b.totalPrice;
        }

        // Tertiary: distance (closer = better)
        const distA = a.averageDistance ?? 999;
        const distB = b.averageDistance ?? 999;
        return distA - distB;
    });

    const primaryStore = sorted[0];

    // Check if we need a multi-store strategy
    if (primaryStore.coverage === 100) {
        // Single store has everything
        return {
            primaryStore,
            recommendation: `Encontrá todo en ${primaryStore.storeName}`,
            isMultiStore: false
        };
    }

    // Calculate multi-store strategy
    const secondaryStores = sorted.slice(1, 4); // Top 3 alternatives
    const multiStoreSavings = calculateMultiStoreSavings(primaryStore, secondaryStores);

    return {
        primaryStore,
        secondaryStores: secondaryStores.length > 0 ? secondaryStores : undefined,
        totalSavings: multiStoreSavings,
        recommendation: primaryStore.coverage >= 70
            ? `Comprá la mayoría en ${primaryStore.storeName} (${Math.round(primaryStore.coverage)}% de cobertura)`
            : `Necesitarás visitar múltiples tiendas`,
        isMultiStore: primaryStore.coverage < 100
    };
}

/**
 * Calculates potential savings from multi-store shopping
 */
export function calculateMultiStoreSavings(
    primaryStore: StoreAnalysis,
    secondaryStores: StoreAnalysis[]
): number {
    if (secondaryStores.length === 0) return 0;

    // Find items that are cheaper in secondary stores
    let savings = 0;

    for (const secondary of secondaryStores) {
        for (const { term, product } of secondary.availableProducts) {
            const primaryProduct = primaryStore.availableProducts.find(p => p.term === term);
            if (primaryProduct && primaryProduct.product.price > product.price) {
                savings += (primaryProduct.product.price - product.price);
            }
        }
    }

    return savings;
}

/**
 * Formats store recommendation for display
 */
export function formatRecommendation(recommendation: StoreRecommendation): string {
    const { primaryStore, isMultiStore, totalSavings } = recommendation;

    let message = `🏪 ${primaryStore.storeName}\n`;
    message += `✓ ${primaryStore.itemsAvailable} de ${primaryStore.totalItems} productos\n`;
    message += `💰 Total: $${primaryStore.totalPrice.toLocaleString('es-AR')}`;

    if (primaryStore.averageDistance) {
        message += `\n📍 A ${primaryStore.averageDistance.toFixed(1)} km`;
    }

    if (isMultiStore && totalSavings && totalSavings > 0) {
        message += `\n\n💡 Podés ahorrar $${totalSavings.toLocaleString('es-AR')} comprando algunos items en otras tiendas`;
    }

    return message;
}
