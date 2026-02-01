#!/usr/bin/env tsx

/**
 * Test script for supermarket API client
 * Usage: npm run test:supermarkets
 */

import { supermarketClient } from './server/supermarkets';

async function testSupermarkets() {
    console.log('🧪 Testing Supermarket API Client\n');
    console.log('='.repeat(60));

    const testQueries = ['leche', 'pan', 'arroz'];

    for (const query of testQueries) {
        console.log(`\n📦 Testing query: "${query}"`);
        console.log('-'.repeat(60));

        try {
            const products = await supermarketClient.searchAll(query);

            console.log(`\n✅ Total products found: ${products.length}`);

            // Group by store
            const byStore = products.reduce((acc, p) => {
                acc[p.store] = (acc[p.store] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            console.log('\n📊 Results by store:');
            Object.entries(byStore).forEach(([store, count]) => {
                console.log(`   ${store}: ${count} products`);
            });

            // Show price range
            if (products.length > 0) {
                const prices = products.map((p) => p.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

                console.log('\n💰 Price statistics:');
                console.log(`   Min: $${minPrice.toFixed(2)}`);
                console.log(`   Max: $${maxPrice.toFixed(2)}`);
                console.log(`   Avg: $${avgPrice.toFixed(2)}`);

                // Show top 5 cheapest
                console.log('\n🏆 Top 5 cheapest:');
                products.slice(0, 5).forEach((p, i) => {
                    console.log(
                        `   ${i + 1}. [${p.store.toUpperCase()}] ${p.name.substring(0, 50)} - $${p.price.toFixed(2)}`
                    );
                });
            }

            // Verify prices are realistic (> $1000 for most items)
            const realisticPrices = products.filter((p) => p.price >= 1000);
            const percentRealistic = (realisticPrices.length / products.length) * 100;

            console.log(`\n✓ Realistic prices (≥ $1000): ${percentRealistic.toFixed(1)}%`);

            if (percentRealistic < 80) {
                console.warn('⚠️  Warning: Many prices seem unrealistically low!');
            }
        } catch (error) {
            console.error(`❌ Error testing "${query}":`, error);
        }

        console.log('\n' + '='.repeat(60));
    }

    console.log('\n✅ Test completed!\n');
}

// Run tests
testSupermarkets().catch(console.error);
