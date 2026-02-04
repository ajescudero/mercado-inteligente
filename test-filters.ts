/**
 * Test specifications for left sidebar filters
 * Verifies that filtering logic works correctly
 */

import { Product } from './server/supermarkets/types';

interface FilterState {
    stores: string[];
    minPrice: number;
    maxPrice: number;
    categories: string[];
}

// Mock product data for testing
const mockProducts: Product[] = [
    {
        id: 'vea-1',
        name: 'Leche Entera La Serenísima 1L',
        price: 850,
        store: 'vea',
        category: 'Lácteos',
        image: 'https://example.com/image1.jpg',
        url: 'https://vea.com.ar/product1'
    },
    {
        id: 'atomo-1',
        name: 'Leche Entera Sancor 1L',
        price: 820,
        store: 'atomo',
        category: 'Lácteos',
        image: 'https://example.com/image2.jpg',
        url: 'https://atomo.com.ar/product1'
    },
    {
        id: 'carrefour-1',
        name: 'Leche Descremada La Serenísima 1L',
        price: 880,
        store: 'carrefour',
        category: 'Lácteos',
        image: 'https://example.com/image3.jpg',
        url: 'https://carrefour.com.ar/product1'
    },
    {
        id: 'vea-2',
        name: 'Pan Lactal Bimbo 500g',
        price: 1200,
        store: 'vea',
        category: 'Panadería',
        image: 'https://example.com/image4.jpg',
        url: 'https://vea.com.ar/product2'
    },
    {
        id: 'atomo-2',
        name: 'Pan Lactal Fargo 500g',
        price: 1100,
        store: 'atomo',
        category: 'Panadería',
        image: 'https://example.com/image5.jpg',
        url: 'https://atomo.com.ar/product2'
    },
    {
        id: 'carrefour-2',
        name: 'Aceite Girasol Cocinero 900ml',
        price: 1500,
        store: 'carrefour',
        category: 'Almacén',
        image: 'https://example.com/image6.jpg',
        url: 'https://carrefour.com.ar/product2'
    },
    {
        id: 'vea-3',
        name: 'Arroz Gallo Oro 1kg',
        price: 950,
        store: 'vea',
        category: 'Almacén',
        image: 'https://example.com/image7.jpg',
        url: 'https://vea.com.ar/product3'
    },
    {
        id: 'atomo-3',
        name: 'Yogur Bebible Sancor 1L',
        price: 1300,
        store: 'atomo',
        category: 'Lácteos',
        image: 'https://example.com/image8.jpg',
        url: 'https://atomo.com.ar/product3'
    },
];

/**
 * Apply filters to products (mimics the logic in page.tsx)
 */
function applyFilters(products: Product[], filters: FilterState): Product[] {
    let result = [...products];

    // Filter by Store
    if (filters.stores.length > 0) {
        result = result.filter(p => filters.stores.includes(p.store));
    }

    // Filter by Price
    if (filters.minPrice > 0) {
        result = result.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
        result = result.filter(p => p.price <= filters.maxPrice);
    }

    // Filter by Category
    if (filters.categories.length > 0) {
        result = result.filter(p => p.category && filters.categories.includes(p.category));
    }

    return result;
}

/**
 * Test runner
 */
function runTests() {
    console.log('🧪 Running Filter Tests\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // Test 1: No filters - should return all products
    {
        const filters: FilterState = { stores: [], minPrice: 0, maxPrice: 0, categories: [] };
        const result = applyFilters(mockProducts, filters);

        if (result.length === mockProducts.length) {
            console.log('✅ Test 1 PASSED: No filters returns all products');
            passed++;
        } else {
            console.log(`❌ Test 1 FAILED: Expected ${mockProducts.length}, got ${result.length}`);
            failed++;
        }
    }

    // Test 2: Filter by single store (Vea)
    {
        const filters: FilterState = { stores: ['vea'], minPrice: 0, maxPrice: 0, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.store === 'vea');

        if (result.length === expected.length && result.every(p => p.store === 'vea')) {
            console.log(`✅ Test 2 PASSED: Filter by Vea returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 2 FAILED: Expected ${expected.length} Vea products, got ${result.length}`);
            console.log('   Results:', result.map(p => `${p.store}: ${p.name}`));
            failed++;
        }
    }

    // Test 3: Filter by multiple stores (Vea and Átomo)
    {
        const filters: FilterState = { stores: ['vea', 'atomo'], minPrice: 0, maxPrice: 0, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.store === 'vea' || p.store === 'atomo');

        if (result.length === expected.length && result.every(p => ['vea', 'atomo'].includes(p.store))) {
            console.log(`✅ Test 3 PASSED: Filter by Vea+Átomo returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 3 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 4: Filter by price range (800-1000)
    {
        const filters: FilterState = { stores: [], minPrice: 800, maxPrice: 1000, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.price >= 800 && p.price <= 1000);

        if (result.length === expected.length && result.every(p => p.price >= 800 && p.price <= 1000)) {
            console.log(`✅ Test 4 PASSED: Price filter (800-1000) returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 4 FAILED: Expected ${expected.length} products, got ${result.length}`);
            console.log('   Results:', result.map(p => `$${p.price}: ${p.name}`));
            failed++;
        }
    }

    // Test 5: Filter by min price only
    {
        const filters: FilterState = { stores: [], minPrice: 1200, maxPrice: 0, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.price >= 1200);

        if (result.length === expected.length && result.every(p => p.price >= 1200)) {
            console.log(`✅ Test 5 PASSED: Min price filter (≥1200) returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 5 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 6: Filter by max price only
    {
        const filters: FilterState = { stores: [], minPrice: 0, maxPrice: 900, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.price <= 900);

        if (result.length === expected.length && result.every(p => p.price <= 900)) {
            console.log(`✅ Test 6 PASSED: Max price filter (≤900) returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 6 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 7: Filter by single category
    {
        const filters: FilterState = { stores: [], minPrice: 0, maxPrice: 0, categories: ['Lácteos'] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.category === 'Lácteos');

        if (result.length === expected.length && result.every(p => p.category === 'Lácteos')) {
            console.log(`✅ Test 7 PASSED: Category filter (Lácteos) returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 7 FAILED: Expected ${expected.length} Lácteos products, got ${result.length}`);
            failed++;
        }
    }

    // Test 8: Filter by multiple categories
    {
        const filters: FilterState = { stores: [], minPrice: 0, maxPrice: 0, categories: ['Lácteos', 'Panadería'] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.category && ['Lácteos', 'Panadería'].includes(p.category));

        if (result.length === expected.length && result.every(p => p.category && ['Lácteos', 'Panadería'].includes(p.category))) {
            console.log(`✅ Test 8 PASSED: Multiple categories returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 8 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 9: Combined filters (Store + Price)
    {
        const filters: FilterState = { stores: ['vea'], minPrice: 900, maxPrice: 1300, categories: [] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.store === 'vea' && p.price >= 900 && p.price <= 1300);

        if (result.length === expected.length) {
            console.log(`✅ Test 9 PASSED: Combined Store+Price filter returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 9 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 10: Combined filters (Store + Category)
    {
        const filters: FilterState = { stores: ['atomo'], minPrice: 0, maxPrice: 0, categories: ['Lácteos'] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p => p.store === 'atomo' && p.category === 'Lácteos');

        if (result.length === expected.length) {
            console.log(`✅ Test 10 PASSED: Combined Store+Category filter returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 10 FAILED: Expected ${expected.length} products, got ${result.length}`);
            failed++;
        }
    }

    // Test 11: All filters combined
    {
        const filters: FilterState = { stores: ['vea', 'atomo'], minPrice: 800, maxPrice: 1100, categories: ['Lácteos', 'Panadería'] };
        const result = applyFilters(mockProducts, filters);
        const expected = mockProducts.filter(p =>
            ['vea', 'atomo'].includes(p.store) &&
            p.price >= 800 &&
            p.price <= 1100 &&
            p.category &&
            ['Lácteos', 'Panadería'].includes(p.category)
        );

        if (result.length === expected.length) {
            console.log(`✅ Test 11 PASSED: All filters combined returns ${result.length} products`);
            passed++;
        } else {
            console.log(`❌ Test 11 FAILED: Expected ${expected.length} products, got ${result.length}`);
            console.log('   Expected:', expected.map(p => `${p.store} - $${p.price} - ${p.category} - ${p.name}`));
            console.log('   Got:', result.map(p => `${p.store} - $${p.price} - ${p.category} - ${p.name}`));
            failed++;
        }
    }

    // Test 12: Filters that match no products
    {
        const filters: FilterState = { stores: ['vea'], minPrice: 5000, maxPrice: 0, categories: [] };
        const result = applyFilters(mockProducts, filters);

        if (result.length === 0) {
            console.log('✅ Test 12 PASSED: Impossible filter returns 0 products');
            passed++;
        } else {
            console.log(`❌ Test 12 FAILED: Expected 0 products, got ${result.length}`);
            failed++;
        }
    }

    console.log('='.repeat(60));
    console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All filter tests passed!\n');
    } else {
        console.log('❌ Some tests failed. Please review the filter logic.\n');
        process.exit(1);
    }
}

// Run tests
runTests();
