import type { Product } from '../server/supermarkets/types';

export interface ComparisonItem extends Product { quantity: number }
export interface EquivalentResult { original: ComparisonItem; equivalents: Product[] }
export interface Scenario {
  id: string; name: string; description: string; total: number; savings: number;
  stores: string[]; mapping: Record<string, Product>;
}
export const cartKey = (product: Product) => `${product.id}-${product.store}`;
export const storeTitle = (product: Product) => [product.storeLabel || product.store, product.storeLocation].filter(Boolean).join(' · ');

export function calculateScenarios(data: EquivalentResult[]): Scenario[] {
  if (!data.length) return [];
  const currentTotal = data.reduce((sum, r) => sum + r.original.price * r.original.quantity, 0);
  const options = data.map(r => [...r.equivalents, r.original].sort((a, b) => a.price - b.price));
  const mapping = Object.fromEntries(data.map((r, i) => [cartKey(r.original), options[i][0]]));
  const total = data.reduce((sum, r) => sum + mapping[cartKey(r.original)].price * r.original.quantity, 0);
  const scenarios: Scenario[] = [{
    id: 'max-savings', name: 'Menor total', description: 'El mismo producto al menor precio. Puede requerir visitar varias sucursales; no incluye traslados.',
    total, savings: currentTotal - total, stores: [...new Set(Object.values(mapping).map(p => p.store))], mapping,
  }];
  const stores = [...new Set(options.flat().map(p => p.store))];
  for (const store of stores) {
    const products = options.map(list => list.find(p => p.store === store));
    // A one-store scenario must actually contain every item at that branch.
    if (products.some(p => !p)) continue;
    const matches = products as Product[];
    const branchTotal = matches.reduce((sum, p, i) => sum + p.price * data[i].original.quantity, 0);
    scenarios.push({
      id: `store:${store}`, name: `Todo en ${matches[0].storeLabel || store}`,
      description: matches[0].storeLocation || 'Todos los productos en la misma sucursal.',
      total: branchTotal, savings: currentTotal - branchTotal, stores: [store],
      mapping: Object.fromEntries(data.map((r, i) => [cartKey(r.original), matches[i]])),
    });
  }
  return scenarios.sort((a, b) => a.total - b.total);
}
