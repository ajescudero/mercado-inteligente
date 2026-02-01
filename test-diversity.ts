import { searchProductsInDb } from './lib/db';

const lat = -32.89084;
const lng = -68.82717;
const term = 'jabon';

console.log(`\n=== Testing diversity for "${term}" ===\n`);

const results = searchProductsInDb(term, lat, lng, 50);

console.log(`Total results: ${results.length}`);

// Count by type
const types = new Map<string, number>();
results.forEach(r => {
    const desc = r.name.toUpperCase();
    let type = 'OTRO';
    if (desc.includes('ROPA') || desc.includes('LAVAR')) type = 'ROPA';
    else if (desc.includes('POLVO') && !desc.includes('TOCADOR')) type = 'POLVO';
    else if (desc.includes('LIQUIDO') || desc.includes('LÍQUIDO')) type = 'LIQUIDO';
    else if (desc.includes('TOCADOR') || desc.includes('PAN') || desc.includes('BARRA')) type = 'TOCADOR';

    types.set(type, (types.get(type) || 0) + 1);
});

console.log('\nProduct type distribution:');
for (const [type, count] of types.entries()) {
    console.log(`  ${type}: ${count}`);
}

console.log('\nFirst 20 products:');
results.slice(0, 20).forEach((r, i) => {
    const desc = r.name.toUpperCase();
    let type = 'OTRO';
    if (desc.includes('ROPA')) type = 'ROPA';
    else if (desc.includes('POLVO')) type = 'POLVO';
    else if (desc.includes('LIQUIDO')) type = 'LIQ';
    else if (desc.includes('TOCADOR') || desc.includes('PAN')) type = 'TOC';

    console.log(`${i + 1}. [${type}] ${r.name.substring(0, 60)} - $${r.price}`);
});
