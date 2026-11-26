-- Empty catalog schema. No prices, credentials or personal lists are distributed.
PRAGMA foreign_keys = ON;
CREATE TABLE stores (
 id TEXT PRIMARY KEY, comercioId TEXT, name TEXT, address TEXT,
 locality TEXT, lat REAL, lng REAL
);
CREATE TABLE products (
 ean TEXT, description TEXT, price REAL, storeId TEXT, comercioId TEXT,
 PRIMARY KEY (ean, description, storeId), FOREIGN KEY (storeId) REFERENCES stores(id)
);
CREATE TABLE store_details (
 store_id TEXT PRIMARY KEY, banner_id TEXT, banner_name TEXT,
 prices_updated_at TEXT, source_date TEXT
);
CREATE TABLE product_details (
 ean TEXT, description TEXT, store_id TEXT, brand TEXT, presentation TEXT,
 PRIMARY KEY (ean, description, store_id)
);
CREATE TABLE price_update_metadata (
 id INTEGER PRIMARY KEY CHECK(id=1), source_date TEXT, source_url TEXT,
 sha256 TEXT, updated_at TEXT
);
CREATE TABLE search_cache (term TEXT PRIMARY KEY, results TEXT, updatedAt INTEGER);
CREATE TABLE term_mappings (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_term TEXT NOT NULL UNIQUE,
 search_terms TEXT NOT NULL, category TEXT, confidence REAL DEFAULT 1.0,
 usage_count INTEGER DEFAULT 0, success_count INTEGER DEFAULT 0,
 last_used DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_description ON products(description);
CREATE INDEX idx_products_ean ON products(ean);
CREATE INDEX idx_products_store_price ON products(storeId, price);
CREATE INDEX idx_stores_locality ON stores(locality);
CREATE INDEX idx_user_term ON term_mappings(user_term);
CREATE INDEX idx_category ON term_mappings(category);
