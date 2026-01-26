import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'shopping-list.db');
const PRECIOS_FILE = path.join(process.cwd(), 'precios_mendoza.json');
const STORES_FILE = path.join(process.cwd(), 'stores_mendoza.json');

const db = new Database(DB_PATH);

// 1. Crear Tablas
console.log('📦 Inicializando base de datos...');
db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        comercioId TEXT,
        name TEXT,
        address TEXT,
        locality TEXT,
        lat REAL,
        lng REAL
    );

    DROP TABLE IF EXISTS products;

    CREATE TABLE products (
        ean TEXT,
        description TEXT,
        price REAL,
        storeId TEXT,
        comercioId TEXT,
        PRIMARY KEY (ean, description, storeId),
        FOREIGN KEY(storeId) REFERENCES stores(id)
    );
    
    -- Índices para búsqueda rápida
    CREATE INDEX IF NOT EXISTS idx_products_description ON products(description);
    CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
    CREATE INDEX IF NOT EXISTS idx_stores_locality ON stores(locality);
`);

// 2. Importar Stores
if (fs.existsSync(STORES_FILE)) {
    const storesData = JSON.parse(fs.readFileSync(STORES_FILE, 'utf-8'));
    console.log(`🏪 Importando ${storesData.length} sucursales...`);

    const insertStore = db.prepare(`
        INSERT OR REPLACE INTO stores (id, comercioId, name, address, locality, lat, lng)
        VALUES (@id, @comercioId, @nombre, @direccion, @localidad, @lat, @lng)
    `);

    const importStoresTx = db.transaction((stores) => {
        for (const store of stores) {
            try {
                const safeStore = {
                    id: String(store.id),
                    comercioId: store.comercioId || null,
                    nombre: store.nombre || 'Desconocido',
                    direccion: store.direccion || '',
                    localidad: store.localidad || '',
                    lat: store.lat || 0,
                    lng: store.lng || 0
                };
                insertStore.run(safeStore);
            } catch (e) {
                console.error('❌ Error insertando tienda:', store.id);
            }
        }
    });

    importStoresTx(storesData);
    console.log('✅ Sucursales importadas.');
}

// 3. Importar Precios
if (fs.existsSync(PRECIOS_FILE)) {
    const pricesData = JSON.parse(fs.readFileSync(PRECIOS_FILE, 'utf-8'));
    console.log(`🍎 Importando ${pricesData.length} precios...`);

    const insertPrice = db.prepare(`
        INSERT OR REPLACE INTO products (ean, description, price, storeId, comercioId)
        VALUES (@ean, @descripcion, @precio, @storeId, @comercioId)
    `);

    const BATCH_SIZE = 10000;
    const insertBatch = db.transaction((batch) => {
        for (const price of batch) {
            const safePrice = {
                ean: String(price.ean || '0'),
                descripcion: (price.descripcion || 'Sin descripción').trim(),
                precio: Number(price.precio) || 0,
                storeId: String(price.storeId || ''),
                comercioId: String(price.comercioId || '')
            };
            insertPrice.run(safePrice);
        }
    });

    for (let i = 0; i < pricesData.length; i += BATCH_SIZE) {
        const batch = pricesData.slice(i, i + BATCH_SIZE);
        insertBatch(batch);
        process.stdout.write(`\r   - Progreso: ${Math.min(i + BATCH_SIZE, pricesData.length)} / ${pricesData.length}`);
    }
    console.log('\n✅ Precios importados exitosamente.');
}

console.log('🚀 Base de datos lista.');
db.close();
