import Database from 'better-sqlite3';
import path from 'path';
import { productImageUrl } from './product-image';

const dbPath = process.env.PRICES_DB_PATH || path.join(process.cwd(), 'shopping-list.db');
export const db = new Database(dbPath, { fileMustExist: true });

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

export interface TermMapping {
  user_term: string;
  search_terms: string[];
  category: string;
  confidence: number;
}

/**
 * Get term mapping from database
 */
export function getTermMapping(userTerm: string): TermMapping | null {
  const normalized = userTerm.toLowerCase().trim();

  try {
    const row = db.prepare(`
      SELECT user_term, search_terms, category, confidence
      FROM term_mappings
      WHERE user_term = ?
    `).get(normalized) as any;

    if (!row) return null;

    return {
      user_term: row.user_term,
      search_terms: JSON.parse(row.search_terms),
      category: row.category,
      confidence: row.confidence
    };
  } catch (e) {
    console.error("Error getting term mapping:", e);
    return null;
  }
}

/**
 * Update mapping usage statistics
 */
export function updateMappingStats(userTerm: string, success: boolean) {
  const normalized = userTerm.toLowerCase().trim();

  try {
    db.prepare(`
      UPDATE term_mappings
      SET usage_count = usage_count + 1,
          success_count = success_count + ?,
          last_used = CURRENT_TIMESTAMP
      WHERE user_term = ?
    `).run(success ? 1 : 0, normalized);
  } catch (e) {
    console.error("Error updating mapping stats:", e);
  }
}

export function searchProductsInDb(term: string, userLat?: number, userLng?: number, maxDistance: number = 20): DbProduct[] {
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
      sd.banner_name as bannerName,
      s.address,
      s.locality,
      s.lat,
      s.lng
      ${hasLocation ? `, haversine(${userLat}, ${userLng}, s.lat, s.lng) as distance` : ''}
    FROM products p
    JOIN stores s ON p.storeId = s.id
    LEFT JOIN store_details sd ON sd.store_id=p.storeId
    WHERE price > 0 
      AND (${whereClause})
      ${hasLocation ? `AND haversine(${userLat}, ${userLng}, s.lat, s.lng) < ${maxDistance}` : ''}
    ORDER BY p.price ASC
    LIMIT 300
  `;

  try {
    const rows = db.prepare(query).all(...params) as any[];

    const mapped = rows.map(row => {
      const brand = row.bannerName || '';
      let storeName = row.rawStoreName || 'Sucursal';

      if (brand) {
        if (!storeName || storeName.toUpperCase() === 'MENDOZA' || storeName.length < 4) {
          storeName = brand;
        } else if (!storeName.toUpperCase().includes(brand.toUpperCase().split(' ')[0])) {
          storeName = `${brand} (${storeName})`;
        }
      }

      const ean = row.ean || '';
      const imageUrl = productImageUrl(ean);

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
    // 1. Sort by price first
    let sorted = mapped.sort((a, b) => a.price - b.price);

    // 2. If location is available, prioritize closer stores when prices are similar
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

    // Return up to 50 results (sorted by price/distance)
    return sorted.slice(0, 50);
  } catch (e) {
    console.error("DB Search Error:", e);
    return [];
  }
}

/**
 * Search products using term mappings for better results
 */
export function searchProductsWithMapping(
  userTerm: string,
  userLat?: number,
  userLng?: number,
  maxDistance: number = 20
): DbProduct[] {
  // 1. Try to get mapping
  const mapping = getTermMapping(userTerm);

  // 2. Determine search terms
  const searchTerms = mapping
    ? mapping.search_terms
    : [userTerm]; // fallback to original

  // 3. Search with all terms (OR logic)
  const allResults: DbProduct[] = [];
  const seenIds = new Set<string>();

  for (const term of searchTerms) {
    const results = searchProductsInDb(term, userLat, userLng, maxDistance);

    for (const product of results) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        allResults.push(product);
      }
    }
  }

  // 4. Update stats
  if (mapping) {
    updateMappingStats(userTerm, allResults.length > 0);
  }

  // 5. Sort by price and return
  return allResults.sort((a, b) => a.price - b.price).slice(0, 50);
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
