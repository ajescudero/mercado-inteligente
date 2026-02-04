import { NextRequest, NextResponse } from 'next/server';
import { supermarketClient } from '@/server/supermarkets';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items list' }, { status: 400 });
        }

        console.log(`[Optimize API] Optimizing cart with ${items.length} items`);

        // To avoid hitting rate limits too hard and to handle performance, 
        // we process items. In a real app, we might want to concurrent-limit this.
        const optimizationResults = [];

        for (const item of items) {
            const equivalents = await supermarketClient.findEquivalents(item.name);
            optimizationResults.push({
                original: item,
                equivalents
            });
        }

        return NextResponse.json({
            results: optimizationResults,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Optimization API Error:', error);
        return NextResponse.json(
            { error: 'Failed to optimize cart' },
            { status: 500 }
        );
    }
}
