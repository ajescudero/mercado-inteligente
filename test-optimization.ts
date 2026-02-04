/**
 * Test specifications for optimization feature
 * Verifies that Vea, Carrefour, and Átomo appear in optimization results
 */

import { supermarketClient } from './server/supermarkets/client';
import { Product } from './server/supermarkets/types';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    store: string;
}

/**
 * Test optimization with real supermarket API calls
 */
async function testOptimization() {
    console.log('🧪 Running Optimization Tests\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // Test products - common items that should exist in all supermarkets
    const testProducts = [
        'leche',
        'arroz',
        'aceite',
        'pan lactal',
        'yogur'
    ];

    console.log('📋 Testing with products:', testProducts.join(', '));
    console.log('');

    for (const productName of testProducts) {
        console.log(`\n🔍 Testing optimization for: "${productName}"`);
        console.log('-'.repeat(60));

        try {
            // Search for equivalents across all supermarkets
            const equivalents = await supermarketClient.findEquivalents(productName);

            console.log(`   Found ${equivalents.length} equivalents total`);

            // Check which supermarkets are present
            const storesFound = new Set(equivalents.map(p => p.store));
            const veaPresent = storesFound.has('vea');
            const carrefourPresent = storesFound.has('carrefour');
            const atomoPresent = storesFound.has('atomo');

            console.log(`   Stores found: ${Array.from(storesFound).join(', ') || 'none'}`);

            // Show products by store
            if (equivalents.length > 0) {
                for (const store of ['vea', 'atomo', 'carrefour']) {
                    const storeProducts = equivalents.filter(p => p.store === store);
                    if (storeProducts.length > 0) {
                        const cheapest = storeProducts.sort((a, b) => a.price - b.price)[0];
                        console.log(`   ${store.toUpperCase()}: ${storeProducts.length} products (cheapest: $${cheapest.price} - ${cheapest.name.substring(0, 50)}...)`);
                    } else {
                        console.log(`   ${store.toUpperCase()}: ❌ No products found`);
                    }
                }
            }

            // Test 1: Vea presence
            if (veaPresent) {
                console.log(`   ✅ Vea is present in results`);
                passed++;
            } else {
                console.log(`   ❌ Vea is MISSING from results`);
                failed++;
            }

            // Test 2: Carrefour presence
            if (carrefourPresent) {
                console.log(`   ✅ Carrefour is present in results`);
                passed++;
            } else {
                console.log(`   ❌ Carrefour is MISSING from results`);
                failed++;
            }

            // Test 3: Átomo presence
            if (atomoPresent) {
                console.log(`   ✅ Átomo is present in results`);
                passed++;
            } else {
                console.log(`   ❌ Átomo is MISSING from results`);
                failed++;
            }

            // Wait a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.log(`   ❌ Error during optimization: ${error}`);
            failed += 3; // Count as 3 failures (one per store)
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
    console.log(`   Total tests: ${testProducts.length * 3} (${testProducts.length} products × 3 supermarkets)`);

    if (failed === 0) {
        console.log('✅ All optimization tests passed!\n');
    } else {
        console.log(`❌ ${failed} tests failed. Issues detected with optimization.\n`);

        // Provide diagnostic information
        console.log('🔍 Diagnostic Information:');
        console.log('   If a supermarket is consistently missing:');
        console.log('   1. Check if the API is working (see logs above)');
        console.log('   2. Verify the search query is compatible with the API');
        console.log('   3. Check if the similarity threshold (0.3) is too strict');
        console.log('   4. Ensure the API endpoint/scraper is not blocked or rate-limited\n');

        process.exit(1);
    }
}

/**
 * Test the full optimization flow with a mock cart
 */
async function testOptimizationFlow() {
    console.log('\n🧪 Testing Full Optimization Flow\n');
    console.log('='.repeat(60));

    // Create a mock cart
    const mockCart: CartItem[] = [
        {
            id: 'cart-1',
            name: 'Leche Entera La Serenísima 1L',
            price: 850,
            quantity: 2,
            store: 'vea'
        },
        {
            id: 'cart-2',
            name: 'Arroz Largo Fino Gallo Oro 1kg',
            price: 950,
            quantity: 1,
            store: 'atomo'
        }
    ];

    console.log('🛒 Mock Cart:');
    mockCart.forEach(item => {
        console.log(`   - ${item.quantity}x ${item.name} ($${item.price} @ ${item.store})`);
    });
    console.log(`   Total: $${mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}`);
    console.log('');

    const results = [];

    for (const item of mockCart) {
        console.log(`\n🔍 Finding equivalents for: ${item.name}`);
        const equivalents = await supermarketClient.findEquivalents(item.name);

        results.push({
            original: item,
            equivalents
        });

        console.log(`   Found ${equivalents.length} equivalents`);
        equivalents.forEach(eq => {
            console.log(`      - ${eq.store.toUpperCase()}: $${eq.price} - ${eq.name.substring(0, 50)}...`);
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate scenarios (simplified version of OptimizationModal logic)
    console.log('\n💰 Calculating Optimization Scenarios:');
    console.log('-'.repeat(60));

    const currentTotal = mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(`   Current total: $${currentTotal}`);

    // Max savings scenario
    let maxSavingTotal = 0;
    const maxSavingProducts: Product[] = [];

    results.forEach(res => {
        const allOptions = [...res.equivalents, {
            id: res.original.id,
            name: res.original.name,
            price: res.original.price,
            store: res.original.store,
            url: '',
            imageUrl: ''
        } as Product];

        const best = allOptions.sort((a, b) => a.price - b.price)[0];
        maxSavingTotal += best.price * res.original.quantity;
        maxSavingProducts.push(best);
    });

    console.log(`   Max saving total: $${maxSavingTotal}`);
    console.log(`   Potential savings: $${currentTotal - maxSavingTotal}`);
    console.log(`   Stores needed: ${Array.from(new Set(maxSavingProducts.map(p => p.store))).join(', ')}`);

    // Check which supermarkets are represented
    const storesInOptimization = new Set(maxSavingProducts.map(p => p.store));
    console.log('\n📊 Supermarket Presence in Optimization:');

    let allPresent = true;
    const supermarkets: Array<'vea' | 'atomo' | 'carrefour'> = ['vea', 'atomo', 'carrefour'];
    for (const store of supermarkets) {
        const present = storesInOptimization.has(store) ||
            results.some(r => r.equivalents.some(e => e.store === store));

        if (present) {
            console.log(`   ✅ ${store.toUpperCase()} available`);
        } else {
            console.log(`   ❌ ${store.toUpperCase()} NOT available`);
            allPresent = false;
        }
    }

    console.log('='.repeat(60));

    if (allPresent) {
        console.log('\n✅ All supermarkets are available in optimization!\n');
    } else {
        console.log('\n❌ Some supermarkets are missing from optimization results.\n');
    }
}

// Run tests
(async () => {
    try {
        await testOptimization();
        await testOptimizationFlow();
    } catch (error) {
        console.error('Fatal error during tests:', error);
        process.exit(1);
    }
})();
