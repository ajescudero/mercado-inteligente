import { db } from './db';
import type { Product } from '../server/supermarkets/types';
import { productImageUrl } from './product-image';
import { classifyProduct } from './product-category';
import { catalogQuery } from './catalog-query';
import { storeLocation, supermarket } from './store-location';
import type { Branch } from './catalog-filters';

interface CatalogRow {
  ean: string; description: string; price: number; storeId: string; comercioId: string;
  storeName: string; address: string; locality: string; bannerId: string; bannerName: string;
  sourceDate: string; pricesUpdatedAt: string | null; brand: string; presentation: string | null;
}

const SELECT_PRODUCTS = `SELECT p.ean, p.description, p.price, p.storeId, p.comercioId,
  s.name AS storeName, s.address, s.locality, sd.banner_id AS bannerId, sd.banner_name AS bannerName,
  sd.source_date AS sourceDate, sd.prices_updated_at AS pricesUpdatedAt, pd.brand, pd.presentation
  FROM products p JOIN stores s ON s.id = p.storeId
  JOIN store_details sd ON sd.store_id = p.storeId
  LEFT JOIN product_details pd ON pd.ean=p.ean AND pd.description=p.description AND pd.store_id=p.storeId`;

interface StoreRow { id: string; address: string; locality: string; lat?: number; lng?: number; bannerName: string }
let metadataCache: { version: number; expires: number; value: ReturnType<typeof readMetadata> } | undefined;
function readMetadata() {
  const meta = db.prepare('SELECT source_date FROM price_update_metadata WHERE id=1').get() as { source_date: string } | undefined;
  const counts = db.prepare('SELECT COUNT(*) AS products, COUNT(DISTINCT storeId) AS stores, SUM(price < 100) AS excludedPrices FROM products WHERE price > 0').get() as { products: number; stores: number; excludedPrices: number };
  const rows = db.prepare(`SELECT s.*, sd.banner_name AS bannerName FROM stores s JOIN store_details sd ON sd.store_id=s.id WHERE EXISTS (SELECT 1 FROM products p WHERE p.storeId=s.id AND p.price>=100)`).all() as StoreRow[];
  const branches: Branch[] = rows.map(row => {
    const group = supermarket(row.bannerName);const location = storeLocation(row);
    return { id: row.id, bannerId: group.id, address: row.address, label: `${row.bannerName === 'COTO CICSA' ? 'Coto' : row.bannerName} · ${row.address}`, ...location };
  }).sort((a,b) => a.label.localeCompare(b.label,'es'));
  const storesAvailable = [...new Map(rows.map(row => { const item = supermarket(row.bannerName);return [item.id,item]; })).values()].sort((a,b) => a.label.localeCompare(b.label,'es'));
  const departments = [...new Map(branches.map(b => [b.departmentId,{id:b.departmentId,label:b.department}])).values()].sort((a,b) => a.label.localeCompare(b.label,'es'));
  const sourceDate = meta?.source_date || null;
  const stale = !sourceDate || Date.now()-Date.parse(`${sourceDate}T00:00:00Z`) > 8*86400000;
  return { branches, storesAvailable, departments, source: 'SEPA' as const, sourceDate, stale, ...counts };
}
export function getCatalogMetadata() {
  const version = db.pragma('data_version', {simple:true}) as number;
  if (!metadataCache || metadataCache.version !== version || metadataCache.expires < Date.now()) metadataCache = {version,expires:Date.now()+60_000,value:readMetadata()};
  return metadataCache.value;
}

function toProduct(row: CatalogRow): Product {
  const branch = (metadataCache?.value ?? getCatalogMetadata()).branches.find(b => b.id === row.storeId);
  return {
    id: Buffer.from(JSON.stringify([row.ean, row.description, row.storeId])).toString('base64url'),
    ean: row.ean, name: row.description, price: row.price, ...classifyProduct(row.description),
    image: productImageUrl(row.ean), brand: row.brand || undefined, presentation: row.presentation || undefined,
    store: row.storeId, storeLabel: row.bannerName === 'COTO CICSA' ? 'Coto' : row.bannerName || row.storeName,
    chainId: supermarket(row.bannerName || row.storeName).id, storeLocation: [row.address, branch?.departmentId === 'unknown' ? row.locality : branch?.department].filter(Boolean).join(', '),
    departmentId: branch?.departmentId, department: branch?.department, locationWarning: branch?.locationWarning,
    source: 'SEPA', sourceDate: row.sourceDate, priceDate: row.pricesUpdatedAt?.slice(0, 10),
    priceWarning: row.price < 100 ? 'Precio atípicamente bajo: confirmalo con el comercio.' : undefined,
  };
}

export function searchCatalog(query: string, limit = 1000) {
  const metadata = getCatalogMetadata();
  if (query.trim().length < 2) return { products: [], metadata: { ...metadata, total: 0, truncated: false } };
  const { where, params, rank, rankParams } = catalogQuery(query);
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM products p WHERE p.price >= 100 AND ${where}`).get(...params) as { count: number }).count;
  const rows = db.prepare(`${SELECT_PRODUCTS} WHERE p.price >= 100 AND ${where} ORDER BY ${rank}, p.price, p.description, p.storeId LIMIT ?`).all(...params, ...rankParams, limit) as CatalogRow[];
  return { products: rows.map(toProduct), metadata: { ...metadata, total, truncated: total > limit } };
}

export function getCatalogProduct(id: string): Product | undefined {
  try {
    const key: unknown = JSON.parse(Buffer.from(id, 'base64url').toString('utf8'));
    if (!Array.isArray(key) || key.length !== 3 || key.some(v => typeof v !== 'string')) return undefined;
    const row = db.prepare(`${SELECT_PRODUCTS} WHERE p.ean=? AND p.description=? AND p.storeId=? AND p.price>=100`).get(...key) as CatalogRow | undefined;
    return row ? toProduct(row) : undefined;
  } catch { return undefined; }
}

export function findCatalogEquivalents(product: Product): Product[] {
  if (!product.ean || product.ean.length < 2) return [];
  const rows = db.prepare(`${SELECT_PRODUCTS} WHERE p.ean=? AND p.price>=100 ORDER BY p.price, p.storeId`).all(product.ean) as CatalogRow[];
  const branches = new Map<string, Product>();
  for (const row of rows) if (!branches.has(row.storeId)) branches.set(row.storeId, toProduct(row));
  return [...branches.values()];
}

const queryCache = new Map<string, { version: number; expires: number; products: Product[] }>();
/** All matching offers stay on the server. No LIMIT before facets/grouping. */
export function searchCatalogAll(query: string) {
  if (query.trim().length < 2) return [];
  const version = db.pragma('data_version', {simple:true}) as number;
  const cached = queryCache.get(query);
  if (cached && cached.version===version && cached.expires>Date.now()) return cached.products;
  const {where,params,rank,rankParams}=catalogQuery(query);
  const rows=db.prepare(`${SELECT_PRODUCTS} WHERE p.price>=100 AND ${where} ORDER BY ${rank}, p.price, p.description, p.storeId`).all(...params,...rankParams) as CatalogRow[];
  const products=rows.map(toProduct);
  if (products.length<=20000) {
    if (queryCache.size>=4) queryCache.delete(queryCache.keys().next().value!);
    queryCache.set(query,{version,expires:Date.now()+60_000,products});
  }
  return products;
}

/** Retailer search can use OR matching; apply the same intent as local SEPA. */
export function filterCatalogMatches(products: Product[], query: string): Product[] {
  const {where,params}=catalogQuery(query);
  const matches=db.prepare(`SELECT 1 FROM (SELECT ? AS description) p WHERE ${where}`);
  return products.filter(product=>!!matches.get(product.name,...params));
}
