import { searchProductsInDb } from './lib/db';

async function testJabonSearch() {
    const lat = -32.89084;
    const lng = -68.82717;
    const term = 'jabon';

    console.log(`\n=== Testing search for "${term}" ===\n`);

    // Test without location
    console.log('1. WITHOUT location filter:');
    const noLocation = searchProductsInDb(term);
    console.log(`   Found: ${noLocation.length} products`);
    if (noLocation.length > 0) {
        console.log(`   First 5:`);
        noLocation.slice(0, 5).forEach(p => console.log(`   - ${p.name.substring(0, 60)}`));
    }

    // Test with different radii
    const radii = [1, 5, 10, 20, 50];
    for (const radius of radii) {
        console.log(`\n2. WITH location (${lat}, ${lng}) and radius ${radius}km:`);
        const results = searchProductsInDb(term, lat, lng, radius);
        console.log(`   Found: ${results.length} products`);
        if (results.length > 0) {
            console.log(`   First 3:`);
            results.slice(0, 3).forEach(p => {
                console.log(`   - ${p.name.substring(0, 50)} (${p.distance?.toFixed(2)}km, $${p.price})`);
            });
        }
    }
}

testJabonSearch().catch(console.error);
