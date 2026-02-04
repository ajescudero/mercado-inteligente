import { NextRequest, NextResponse } from 'next/server';
import { supermarketClient } from '@/server/supermarkets';

export const dynamic = 'force-dynamic'; // Ensure no caching of the response itself by Next.js

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ products: [] });
    }

    try {
        const products = await supermarketClient.searchAll(query);
        return NextResponse.json({
            products,
            metadata: {
                total: products.length,
                sources: ['vea', 'atomo', 'carrefour']
            }
        });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
