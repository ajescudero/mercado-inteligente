const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'shopping-list.db');
const db = new Database(dbPath);

console.log("--- TABLE: products ---");
const productsInfo = db.prepare("PRAGMA table_info(products)").all();
console.table(productsInfo);

console.log("\n--- TABLE: stores ---");
const storesInfo = db.prepare("PRAGMA table_info(stores)").all();
console.table(storesInfo);

console.log("\n--- SAMPLE: Naranja ---");
const results = db.prepare(`
    SELECT p.*, s.name as storeName 
    FROM products p 
    JOIN stores s ON p.storeId = s.id 
    WHERE p.description LIKE '%naranja%' 
    LIMIT 10
`).all();
console.table(results);

console.log("\n--- STATS ---");
const stats = db.prepare("SELECT count(*) as count FROM products WHERE price <= 0").get();
console.log("Products with price <= 0:", stats.count);
const total = db.prepare("SELECT count(*) as count FROM products").get();
console.log("Total products:", total.count);
