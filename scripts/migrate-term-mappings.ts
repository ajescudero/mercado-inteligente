import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'shopping-list.db');
const db = new Database(dbPath);

console.log('Creating term_mappings table...');

db.exec(`
  CREATE TABLE IF NOT EXISTS term_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_term TEXT NOT NULL UNIQUE,
    search_terms TEXT NOT NULL,
    category TEXT,
    confidence REAL DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_user_term ON term_mappings(user_term);
  CREATE INDEX IF NOT EXISTS idx_category ON term_mappings(category);
`);

console.log('✅ term_mappings table created successfully');

// Insert manual seed data for common Argentine grocery terms
console.log('Inserting seed data...');

const seedData = [
    // Carnes
    { user_term: 'morcillas', search_terms: '["MORCILLA"]', category: 'carnes', confidence: 1.0 },
    { user_term: 'morcilla', search_terms: '["MORCILLA"]', category: 'carnes', confidence: 1.0 },
    { user_term: 'chorizos', search_terms: '["CHORIZO"]', category: 'carnes', confidence: 1.0 },
    { user_term: 'chorizo', search_terms: '["CHORIZO"]', category: 'carnes', confidence: 1.0 },
    { user_term: 'vacío', search_terms: '["VACIO", "CORTE VACIO", "CARNE VACIO"]', category: 'carnes', confidence: 0.9 },
    { user_term: 'vacio', search_terms: '["VACIO", "CORTE VACIO", "CARNE VACIO"]', category: 'carnes', confidence: 0.9 },
    { user_term: 'asado', search_terms: '["ASADO", "TIRA ASADO"]', category: 'carnes', confidence: 1.0 },
    { user_term: 'carne para bifes', search_terms: '["BIFE", "NALGA", "CUADRIL"]', category: 'carnes', confidence: 0.8 },
    { user_term: 'carne para bifes a la plancha', search_terms: '["BIFE", "NALGA", "CUADRIL"]', category: 'carnes', confidence: 0.8 },
    { user_term: 'bifes', search_terms: '["BIFE", "NALGA", "CUADRIL"]', category: 'carnes', confidence: 0.9 },
    { user_term: 'bife', search_terms: '["BIFE", "NALGA", "CUADRIL"]', category: 'carnes', confidence: 0.9 },

    // Bebidas
    { user_term: 'coca cola', search_terms: '["COCA COLA", "COCA"]', category: 'bebidas', confidence: 1.0 },
    { user_term: 'coca', search_terms: '["COCA COLA", "COCA"]', category: 'bebidas', confidence: 1.0 },
    { user_term: 'fernet', search_terms: '["FERNET"]', category: 'bebidas', confidence: 1.0 },
    { user_term: 'cerveza', search_terms: '["CERVEZA"]', category: 'bebidas', confidence: 1.0 },
    { user_term: 'vino', search_terms: '["VINO"]', category: 'bebidas', confidence: 1.0 },
    { user_term: 'gaseosa', search_terms: '["GASEOSA", "COCA", "SPRITE", "FANTA"]', category: 'bebidas', confidence: 0.8 },

    // Lácteos
    { user_term: 'leche', search_terms: '["LECHE"]', category: 'lacteos', confidence: 1.0 },
    { user_term: 'leche entera', search_terms: '["LECHE ENTERA"]', category: 'lacteos', confidence: 1.0 },
    { user_term: 'dulce de leche', search_terms: '["DULCE DE LECHE", "DULCE LECHE"]', category: 'lacteos', confidence: 1.0 },
    { user_term: 'yogur', search_terms: '["YOGUR", "YOGURT"]', category: 'lacteos', confidence: 1.0 },
    { user_term: 'queso', search_terms: '["QUESO"]', category: 'lacteos', confidence: 1.0 },
    { user_term: 'manteca', search_terms: '["MANTECA"]', category: 'lacteos', confidence: 1.0 },

    // Panadería
    { user_term: 'pan', search_terms: '["PAN"]', category: 'panaderia', confidence: 1.0 },
    { user_term: 'pan lactal', search_terms: '["PAN LACTAL", "PAN DE MIGA"]', category: 'panaderia', confidence: 1.0 },
    { user_term: 'pan de miga', search_terms: '["PAN DE MIGA", "PAN LACTAL"]', category: 'panaderia', confidence: 1.0 },
    { user_term: 'facturas', search_terms: '["FACTURA", "MEDIALUNAS"]', category: 'panaderia', confidence: 0.8 },

    // Almacén
    { user_term: 'arroz', search_terms: '["ARROZ"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'aceite', search_terms: '["ACEITE"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'fideos', search_terms: '["FIDEOS", "PASTA"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'azúcar', search_terms: '["AZUCAR"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'azucar', search_terms: '["AZUCAR"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'sal', search_terms: '["SAL"]', category: 'almacen', confidence: 1.0 },
    { user_term: 'harina', search_terms: '["HARINA"]', category: 'almacen', confidence: 1.0 },
];

const stmt = db.prepare(`
  INSERT OR REPLACE INTO term_mappings 
  (user_term, search_terms, category, confidence)
  VALUES (?, ?, ?, ?)
`);

for (const data of seedData) {
    stmt.run(data.user_term, data.search_terms, data.category, data.confidence);
}

console.log(`✅ Inserted ${seedData.length} seed mappings`);

// Verify
const count = db.prepare('SELECT COUNT(*) as count FROM term_mappings').get() as { count: number };
console.log(`📊 Total mappings in database: ${count.count}`);

db.close();
console.log('✅ Migration completed successfully');
