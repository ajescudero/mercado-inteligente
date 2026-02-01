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

console.log("\n--- COUNT: Leche ---");
const milkCount = db.prepare("SELECT count(*) as count FROM products WHERE description LIKE '%leche%'").get();
const milkStores = db.prepare("SELECT DISTINCT s.name FROM products p JOIN stores s ON p.storeId = s.id WHERE p.description LIKE '%leche%'").all();
console.log("Total Leche products:", milkCount.count);
console.log("Stores selling Leche:", milkStores.map(s => s.name));

console.log("\n--- SEARCH: Atomo ---");
const atomoStores = db.prepare("SELECT * FROM stores WHERE name LIKE '%atomo%' OR name LIKE '%millan%'").all();
console.table(atomoStores);

console.log("\n--- STATS ---");
const stats = db.prepare("SELECT count(*) as count FROM products WHERE price <= 0").get();
console.log("Products with price <= 0:", stats.count);
const total = db.prepare("SELECT count(*) as count FROM products").get();
console.log("Total products:", total.count);
