import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'shopping-list.db');
export const db = new Database(dbPath);

/**
 * Register a Haversine Distance function in SQLite
 * Calculates distance in km between two lat/lng points
 */
db.function('haversine', (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
});

// Initialize Cache
db.exec(`
  CREATE TABLE IF NOT EXISTS search_cache (
    term TEXT PRIMARY KEY,
    results TEXT,
    updatedAt INTEGER
  );
`);

export function getCachedSearch(term: string) {
  return db.prepare('SELECT * FROM search_cache WHERE term = ?').get(term) as any;
}

export function setCachedSearch(term: string, results: any[]) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO search_cache (term, results, updatedAt)
    VALUES (@term, @results, @updatedAt)
  `);
  stmt.run({
    term,
    results: JSON.stringify(results),
    updatedAt: Date.now()
  });
}

export interface DbProduct {
  id: string;
  ean: string;
  name: string;
  price: number;
  store: string;
  address: string;
  locality: string;
  image?: string;
  brand: string;
  distance?: number;
}

const COMERCIO_BRANDS: Record<string, string> = {
  '10': 'Vea / Jumbo',
  '11': 'ChangoMás',
  '12': 'Carrefour',
  '13': 'Coto',
  '15': 'La Anónima',
  '16': 'Libertad',
  '19': 'Makro',
  '24': 'Día',
};

export function searchProductsInDb(term: string, userLat?: number, userLng?: number): DbProduct[] {
  const safeTerm = term.trim();
  if (!safeTerm) return [];

  const keywords = safeTerm.split(/\s+/).filter(k => k.length > 0);
  const whereClause = keywords.map(() => `p.description LIKE ?`).join(' AND ');
  const params = keywords.map(k => `%${k}%`);

  const hasLocation = userLat !== undefined && userLng !== undefined;

  const query = `
    SELECT
      p.ean,
      p.description as name,
      p.price,
      p.comercioId,
      s.name as rawStoreName,
      s.address,
      s.locality,
      s.lat,
      s.lng
      ${hasLocation ? `, haversine(${userLat}, ${userLng}, s.lat, s.lng) as distance` : ''}
    FROM products p
    JOIN stores s ON p.storeId = s.id
    WHERE price > 0 AND (${whereClause})
    ORDER BY p.price ASC
    LIMIT 100
  `;

  try {
    const rows = db.prepare(query).all(...params) as any[];

    const mapped = rows.map(row => {
      const brand = COMERCIO_BRANDS[row.comercioId] || '';
      let storeName = row.rawStoreName || 'Sucursal';

      if (brand) {
        if (!storeName || storeName.toUpperCase() === 'MENDOZA' || storeName.length < 4) {
          storeName = brand;
        } else if (!storeName.toUpperCase().includes(brand.toUpperCase().split(' ')[0])) {
          storeName = `${brand} (${storeName})`;
        }
      }

      const ean = row.ean || '';
      const imageUrl = (ean.length >= 12 && ean !== '0' && ean !== '1')
        ? `https://imagenes.preciosclaros.gob.ar/productos/${ean}.jpg`
        : undefined;

      return {
        id: `${row.ean}-${row.name}-${row.rawStoreName}-${row.price}`,
        ean: row.ean,
        name: row.name,
        price: row.price,
        store: storeName,
        address: row.address || '',
        locality: row.locality || '',
        image: imageUrl,
        brand: brand || 'Genérica',
        distance: row.distance
      };
    });

    // Ranking Logic:
    // 1. If location is available: Sort by (Price * Distance_Factor) or just strictly by price within a radius.
    // Let's go with: Best price first, but group by product-chain.
    // User requested "Leave only lowest prices and close to location".

    // First, let's sort by price.
    let sorted = mapped.sort((a, b) => a.price - b.price);

    // If we have location, let's prioritize things within 10km if price is similar (+/- 10%)
    if (hasLocation) {
      sorted.sort((a, b) => {
        const distA = a.distance || 0;
        const distB = b.distance || 0;

        // If one is significantly cheaper (20%), keep it first regardless of distance
        const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
        if (priceDiff > 0.2) return a.price - b.price;

        // If prices are similar, closer is better
        return distA - distB;
      });
    }

    return sorted.slice(0, 50);

  } catch (e) {
    console.error("DB Search Error:", e);
    return [];
  }
}

export function getProductSuggestions(term: string): string[] {
  const safeTerm = term.trim().toUpperCase();
  if (!safeTerm || safeTerm.length < 2) return [];

  // Strategy:
  // 1. Get products where term is at the START (most relevant)
  // 2. Diversify by extracting "product type" (first 2-3 words) and showing one of each
  // 3. This ensures "LECHE ENTERA", "LECHE DESCREMADA", "LECHE CHOCOLATADA" all appear

  const query = `
    SELECT DISTINCT description
    FROM products
    WHERE UPPER(description) LIKE ?
    ORDER BY description
    LIMIT 100
  `;

  try {
    const startsWithPattern = `${safeTerm}%`;
    const rows = db.prepare(query).all(startsWithPattern) as { description: string }[];

    if (rows.length === 0) {
      // Fallback to contains search
      const fallbackQuery = `
        SELECT DISTINCT description
        FROM products
        WHERE UPPER(description) LIKE ?
        ORDER BY description
        LIMIT 50
      `;
      const fallbackRows = db.prepare(fallbackQuery).all(`%${safeTerm}%`) as { description: string }[];
      return fallbackRows.slice(0, 10).map(r => r.description);
    }

    // Extract "type key" from each description (first 2 significant words)
    const getTypeKey = (desc: string): string => {
      const words = desc.split(/\s+/).filter(w => w.length > 1);
      // Take first 2 words as the type, e.g., "LECHE ENTERA", "LECHE DESCREMADA"
      const typeWords = words.slice(0, 2);
      return typeWords.join(' ');
    };

    // Group by type and pick one representative from each
    const typeMap = new Map<string, string>();
    for (const row of rows) {
      const typeKey = getTypeKey(row.description);
      if (!typeMap.has(typeKey)) {
        typeMap.set(typeKey, row.description);
      }
    }

    // Return diverse suggestions
    return Array.from(typeMap.values()).slice(0, 10);
  } catch (e) {
    console.error("Suggestions Error:", e);
    return [];
  }
}

/**
 * Get product suggestions for multiple normalized terms (from AI).
 * For each term, finds one matching product from the database.
 */
export async function getProductSuggestionsForTerms(terms: string[]): Promise<string[]> {
  const results: string[] = [];

  for (const term of terms) {
    const safeTerm = term.trim().toUpperCase();
    if (!safeTerm) continue;

    const query = `
      SELECT description
      FROM products
      WHERE UPPER(description) LIKE ?
      ORDER BY description
      LIMIT 1
    `;

    try {
      const row = db.prepare(query).get(`${safeTerm}%`) as { description: string } | undefined;
      if (row) {
        results.push(row.description);
      }
    } catch (e) {
      console.error(`Error fetching suggestion for term "${term}":`, e);
    }
  }

  return results;
}
