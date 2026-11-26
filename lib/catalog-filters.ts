import type { Product } from '../server/supermarkets/types';

export interface FilterState { types: string[]; categories: string[]; department: string; stores: string[]; branch: string; minPrice: number; maxPrice: number }
export const emptyFilters: FilterState = { types: [], categories: [], department: '', stores: [], branch: '', minPrice: 0, maxPrice: 0 };
export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'alpha-asc' | 'unit-asc';
export interface Facet { id: string; label: string; count: number }
export interface Branch { id: string; bannerId: string; label: string; address: string; departmentId: string; department: string; locationWarning?: string; kind?: 'online' | 'physical'; priceStatus?: 'available' | 'not-integrated'; sourceUrl?: string }
export interface ProductGroup { id: string; product: Product; offers: Product[]; offerCount: number }
export const normalize = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export const groupKey = (p: Product) => p.source === 'ONLINE' ? `online:${p.id}` : `sepa:${p.ean || p.id}`;

export function unitPrice(p: Product): { price: number; unit: 'L' | 'kg' } | undefined {
  // Use the validated presentation, never infer multipacks from a product name.
  const match = p.presentation?.match(/^(\d+(?:[.,]\d+)?)\s*(ml|L|g|kg)$/i);
  if (!match) return;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const unit = match[2].toLowerCase();
  return { price: p.price / (unit === 'ml' || unit === 'g' ? amount / 1000 : amount), unit: unit === 'ml' || unit === 'l' ? 'L' : 'kg' };
}
export function matchesFilters(p: Product, f: FilterState, omit: (keyof FilterState)[] = []) {
  const enabled = (key: keyof FilterState) => !omit.includes(key);
  return (!enabled('types') || !f.types.length || f.types.includes(p.productType || 'Otros')) &&
    (!enabled('categories') || !f.categories.length || f.categories.includes(p.category || 'Sin clasificar')) &&
    (!enabled('department') || !f.department || p.departmentId === f.department) &&
    (!enabled('stores') || !f.stores.length || f.stores.includes(p.chainId || p.store)) &&
    (!enabled('branch') || !f.branch || p.store === f.branch) &&
    (!enabled('minPrice') || !f.minPrice || p.price >= f.minPrice) && (!enabled('maxPrice') || !f.maxPrice || p.price <= f.maxPrice);
}
export function groupProducts(products: Product[], query: string, sort: SortOption): ProductGroup[] {
  const groups = new Map<string, Map<string, Product>>();
  for (const p of products) {
    const key = groupKey(p); const offers = groups.get(key) || new Map<string, Product>();
    // Count one offer per branch. Preserve its canonical id for adding to cart.
    const previous = offers.get(p.store);
    if (!previous || p.price < previous.price || (p.price === previous.price && p.id < previous.id)) offers.set(p.store, p);
    groups.set(key, offers);
  }
  const result = [...groups].map(([id, map]) => {
    const offers = [...map.values()].sort((a, b) => a.price - b.price || a.store.localeCompare(b.store));
    return { id, product: offers[0], offers, offerCount: offers.length };
  });
  const q = normalize(query);
  return result.sort((a, b) => {
    let diff = 0;
    if (sort === 'price-desc') diff = b.product.price - a.product.price;
    else if (sort === 'alpha-asc') diff = a.product.name.localeCompare(b.product.name, 'es');
    else if (sort === 'unit-asc') diff = (unitPrice(a.product)?.price ?? Infinity) - (unitPrice(b.product)?.price ?? Infinity);
    else if (sort === 'relevance') diff = Number(!normalize(a.product.name).startsWith(q)) - Number(!normalize(b.product.name).startsWith(q));
    return (Number.isNaN(diff) ? 0 : diff) || a.product.price - b.product.price || a.id.localeCompare(b.id);
  });
}
export function buildFacets(products: Product[], filters: FilterState) {
  const build = (field: 'productType' | 'category' | 'departmentId' | 'chainId' | 'store', omit: (keyof FilterState)[]) => {
    const values = new Map<string, Set<string>>();
    for (const p of products) if (matchesFilters(p, filters, omit)) {
      const value = p[field]; if (!value) continue;
      const keys = values.get(value) || new Set<string>();keys.add(groupKey(p));values.set(value, keys);
    }
    return Object.fromEntries([...values].map(([key, keys]) => [key, keys.size]));
  };
  return { types: build('productType', ['types','categories']), categories: build('category', ['categories']), departments: build('departmentId', ['department','branch']), stores: build('chainId', ['stores','branch']), branches: build('store', ['branch']) };
}
export function filterParams(f: FilterState) {
  const p = new URLSearchParams();
  for (const value of f.types) p.append('type', value);
  for (const value of f.categories) p.append('category', value);
  for (const value of f.stores) p.append('store', value);
  if (f.department) p.set('department', f.department);
  if (f.branch) p.set('branch', f.branch);
  if (f.minPrice) p.set('min', String(f.minPrice));
  if (f.maxPrice) p.set('max', String(f.maxPrice));
  return p;
}
export function parseFilters(p: URLSearchParams): FilterState {
  const list = (key: string) => { const values = p.getAll(key); if (values.length > 30 || values.some(v => !v || v.length > 160)) throw new Error('Revisá los filtros seleccionados.'); return [...new Set(values)]; };
  const number = (key: string) => { const raw = p.get(key);const value = raw ? Number(raw) : 0;if (!Number.isFinite(value) || value < 0 || value > 1e9) throw new Error('Ingresá un precio válido, mayor o igual a cero.');return value; };
  const filters = { types: list('type'), categories: list('category'), stores: list('store'), department: p.get('department') || '', branch: p.get('branch') || '', minPrice: number('min'), maxPrice: number('max') };
  if (filters.branch.length > 160 || filters.department.length > 100) throw new Error('Revisá la ubicación seleccionada.');
  if (filters.maxPrice && filters.minPrice > filters.maxPrice) throw new Error('El precio máximo debe ser mayor o igual al mínimo.');
  return filters;
}
