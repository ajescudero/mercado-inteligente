import { NextResponse } from 'next/server';
import { searchProduct } from '@/lib/search';
import { BatchSearchResult, StoreRecommendation } from '@/lib/types';
import { analyzeStoresByProducts, findOptimalShoppingStrategy } from '@/lib/store-optimizer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { terms, lat, lng, radius } = body;

        if (!terms || !Array.isArray(terms) || terms.length === 0) {
            return NextResponse.json(
                { error: 'Terms array is required' },
                { status: 400 }
            );
        }

        // Perform parallel searches for all terms
        const searchPromises = terms.map(async (term: string) => {
            try {
                const result = await searchProduct(term, lat, lng, radius);
                return {
                    term,
                    products: result.data,
                    bestPrice: result.data.length > 0 ? result.data[0].price : undefined,
                    status: result.data.length > 0 ? 'FOUND' : 'NOT_FOUND'
                } as BatchSearchResult;
            } catch (error) {
                console.error(`Error searching for "${term}":`, error);
                return {
                    term,
                    products: [],
                    status: 'ERROR'
                } as BatchSearchResult;
            }
        });

        const results = await Promise.all(searchPromises);

        // Analyze stores and find optimal strategy
        const storeAnalyses = analyzeStoresByProducts(results);
        const recommendation = findOptimalShoppingStrategy(storeAnalyses);

        return NextResponse.json({
            results,
            storeAnalyses,
            recommendation
        });
    } catch (error) {
        console.error('Batch search error:', error);
        return NextResponse.json(
            { error: 'Batch search failed' },
            { status: 500 }
        );
    }
}
