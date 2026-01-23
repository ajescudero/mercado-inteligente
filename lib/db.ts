import Database from 'better-sqlite3';
import path from 'path';

// Construct the path to the database file
const dbPath = path.join(process.cwd(), 'shopping-list.db');

export const db = new Database(dbPath);

// Initialize the table if it doesn't exist
const initScript = `
  CREATE TABLE IF NOT EXISTS search_cache (
    term TEXT PRIMARY KEY,
    results TEXT, -- JSON string of Product[]
    updatedAt INTEGER -- Unix timestamp
  );
`;

db.exec(initScript);

export function getCachedSearch(term: string) {
    const row = db.prepare('SELECT * FROM search_cache WHERE term = ?').get(term) as { term: string, results: string, updatedAt: number } | undefined;
    return row;
}

export function setCachedSearch(term: string, results: any[]) {
    const now = Date.now();
    const stmt = db.prepare(`
    INSERT INTO search_cache (term, results, updatedAt)
    VALUES (@term, @results, @updatedAt)
    ON CONFLICT(term) DO UPDATE SET
      results = @results,
      updatedAt = @updatedAt
  `);

    stmt.run({
        term,
        results: JSON.stringify(results),
        updatedAt: now
    });
}
