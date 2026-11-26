import type { Product } from '../server/supermarkets/types';
import { cartKey, storeTitle, type EquivalentResult, type Scenario } from './cart-optimization';

export interface NetSavingsOptions {
  maxVisits: 1 | 2 | 3;
  visitCost: number;
  onlineTotal?: number;
  deliveryCost?: number;
}
export interface CostBreakdown {
  catalogTotal: number;
  onlineTotal: number;
  productTotal: number;
  travelCost: number;
  deliveryCost: number;
  total: number;
  visits: number;
}
export interface NetScenario extends Scenario, CostBreakdown {}
export interface NetComparison {
  current: CostBreakdown;
  scenarios: NetScenario[];
}

const cents = (amount: number) => Math.round(amount * 100);
const amount = (value: number) => value / 100;

/** Accept decimal commas without silently treating a missing or invalid cost as free. */
export function parseEstimatedCost(value: string): number | null {
  const clean = value.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(clean)) return null;
  const result = Number(clean.replace(',', '.'));
  return Number.isFinite(result) && result <= 1_000_000 ? result : null;
}

/** Exact enumeration of every subset of up to three branches; no name-based substitutes. */
export function calculateNetScenarios(data: EquivalentResult[], options: NetSavingsOptions): NetComparison {
  const { maxVisits, visitCost, onlineTotal = 0, deliveryCost = 0 } = options;
  if (![1, 2, 3].includes(maxVisits) || [visitCost, onlineTotal, deliveryCost].some(n => !Number.isFinite(n) || n < 0)) {
    throw new Error('Los gastos deben ser importes válidos y el límite debe ser de 1 a 3 sucursales.');
  }
  const visitCents = cents(visitCost), onlineCents = cents(onlineTotal), deliveryCents = cents(deliveryCost);
  const breakdown = (catalogCents: number, visits: number): CostBreakdown => ({
    catalogTotal: amount(catalogCents), onlineTotal: amount(onlineCents),
    productTotal: amount(catalogCents + onlineCents), travelCost: amount(visits * visitCents),
    deliveryCost: amount(deliveryCents), total: amount(catalogCents + onlineCents + visits * visitCents + deliveryCents), visits,
  });
  for (const row of data) {
    if (!Number.isInteger(row.original.quantity) || row.original.quantity < 1 ||
        [row.original, ...row.equivalents].some(p => !Number.isFinite(p.price) || p.price < 0 || !p.store || p.source === 'ONLINE' || p.store === 'atomo-online')) {
      throw new Error('La comparación requiere precios de sucursal y cantidades válidas.');
    }
  }
  const current = breakdown(data.reduce((sum, r) => sum + cents(r.original.price) * r.original.quantity, 0), new Set(data.map(r => r.original.store)).size);
  if (!data.length) return { current, scenarios: [] };

  // Keep one canonical offer per branch and item. An equal price retains the original offer.
  const offers = data.map(row => {
    const byStore = new Map<string, Product>();
    for (const product of [row.original, ...row.equivalents]) {
      const previous = byStore.get(product.store);
      if (!previous || cents(product.price) < cents(previous.price)) byStore.set(product.store, product);
    }
    return byStore;
  });
  const stores = [...new Set(offers.flatMap(row => [...row.keys()]))].sort();
  const matrix = stores.map(store => offers.map(row => row.get(store)));
  const singles: NetScenario[] = [];
  const bestByVisits = new Map<number, NetScenario>();
  const changes = (s: NetScenario) => data.filter(r => cartKey(s.mapping[cartKey(r.original)]) !== cartKey(r.original)).length;
  const compare = (a: NetScenario, b: NetScenario) => cents(a.total) - cents(b.total) || a.visits - b.visits || changes(a) - changes(b) || a.id.localeCompare(b.id);

  function consider(products: (Product | undefined)[], selected: number[]) {
    if (products.some(p => !p)) return;
    const matches = products as Product[];
    const used = [...new Set(matches.map(p => p.store))].sort();
    // Unused visits must never incur a fee. Their smaller subset is evaluated separately.
    if (used.length !== selected.length) return;
    const catalogCents = matches.reduce((sum, p, i) => sum + cents(p.price) * data[i].original.quantity, 0);
    const costs = breakdown(catalogCents, used.length);
    const best = bestByVisits.get(used.length);
    if (used.length > 1 && best && cents(costs.total) > cents(best.total)) return;
    const mapping = Object.fromEntries(data.map((r, i) => [cartKey(r.original), matches[i]]));
    const scenario: NetScenario = {
      ...costs, id: `net:${JSON.stringify(used)}`,
      name: used.length === 1 ? `1 sucursal · ${matches[0].storeLabel || used[0]}` : `${used.length} sucursales`,
      description: used.map(store => storeTitle(matches.find(p => p.store === store)!)).join(' / '),
      savings: amount(cents(current.total) - cents(costs.total)), stores: used, mapping,
    };
    if (used.length === 1) singles.push(scenario);
    if (!best || compare(scenario, best) < 0) bestByVisits.set(used.length, scenario);
  }

  function search(start: number, selected: number[], bestOffers: (Product | undefined)[]) {
    for (let s = start; s < stores.length; s++) {
      const merged = bestOffers.map((previous, i) => {
        const next = matrix[s][i];
        if (!next) return previous;
        if (!previous || cents(next.price) < cents(previous.price) ||
            (cents(next.price) === cents(previous.price) && next.store === data[i].original.store)) return next;
        return previous;
      });
      const subset = [...selected, s];
      consider(merged, subset);
      if (subset.length < maxVisits) search(s + 1, subset, merged);
    }
  }
  search(0, [], data.map(() => undefined));
  const scenarios = [...singles, ...[...bestByVisits.values()].filter(s => s.visits > 1)].sort(compare);
  return { current, scenarios };
}
