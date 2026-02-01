import { searchProductsInDb } from './lib/db';

async function testDeduplication() {
    const lat = -32.89084;
    const lng = -68.82717;
    const term = 'jabon';

    console.log(`\n=== Testing deduplication for "${term}" ===\n`);

    const results = searchProductsInDb(term, lat, lng, 50);

    console.log(`Total results: ${results.length}`);

    // Count by EAN
    const eanCounts = new Map<string, number>();
    for (const r of results) {
        const count = eanCounts.get(r.ean) || 0;
        eanCounts.set(r.ean, count + 1);
    }

    console.log(`Unique EANs: ${eanCounts.size}`);
    console.log(`\nEANs with duplicates:`);
    for (const [ean, count] of eanCounts.entries()) {
        if (count > 1) {
            const products = results.filter(r => r.ean === ean);
            console.log(`  ${ean}: ${count} times`);
            console.log(`    Products: ${products.map(p => `${p.name.substring(0, 30)} @ ${p.store} ($${p.price})`).join(', ')}`);
        }
    }
}

testDeduplication().catch(console.error);
