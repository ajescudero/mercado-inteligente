import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetScenarios, parseEstimatedCost } from '../lib/net-savings';
import { cartKey, type EquivalentResult } from '../lib/cart-optimization';
import { applyCatalogComparison } from '../lib/cart-products';
import type { Product } from '../server/supermarkets/types';

const product = (id: string, store: string, price: number): Product => ({ id: `${id}-${store}`, name: id, ean: id, store, storeLabel: store, price, source: 'SEPA' });
const basket: EquivalentResult[] = [
  { original: { ...product('milk', 'A', 2000), quantity: 2 }, equivalents: [product('milk', 'B', 1000)] },
  { original: { ...product('bread', 'A', 2000), quantity: 1 }, equivalents: [product('bread', 'C', 1000)] },
];

test('travel costs reverse the best recommendation and quantities determine savings', () => {
  const free = calculateNetScenarios(basket, { maxVisits: 3, visitCost: 0 });
  assert.equal(free.current.total, 6000);
  assert.equal(free.scenarios[0].productTotal, 3000);
  assert.deepEqual(free.scenarios[0].stores, ['B', 'C']);
  assert.equal(free.scenarios[0].savings, 3000);
  const costly = calculateNetScenarios(basket, { maxVisits: 3, visitCost: 4000 });
  assert.deepEqual(costly.scenarios[0].stores, ['A']);
  assert.equal(costly.scenarios[0].total, 10000);
  assert.equal(costly.scenarios[0].savings, 0);
  assert.equal(costly.scenarios.find(s => s.stores.join() === 'B,C')?.savings, -1000);
});

test('visit limits require complete coverage; absent prices are never zero', () => {
  const separate = basket.map((r, i) => ({ ...r, original: { ...r.equivalents[0], quantity: i + 1 }, equivalents: [] }));
  assert.equal(calculateNetScenarios(separate, { maxVisits: 1, visitCost: 100 }).scenarios.length, 0);
  const two = calculateNetScenarios(separate, { maxVisits: 2, visitCost: 100 }).scenarios[0];
  assert.equal(two.visits, 2); assert.equal(two.total, 3200);
  assert(calculateNetScenarios(basket, { maxVisits: 1, visitCost: 0 }).scenarios.every(s => s.visits === 1));
});

test('fixed online items and delivery are included unchanged in both totals and applying a scenario', () => {
  const comparison = calculateNetScenarios(basket, { maxVisits: 2, visitCost: 500, onlineTotal: 9000, deliveryCost: 1500 });
  const best = comparison.scenarios[0];
  assert.equal(comparison.current.total, 17000);
  assert.equal(best.total, 14500); assert.equal(best.savings, 2500);
  assert.equal(best.deliveryCost, 1500); assert.equal(best.onlineTotal, 9000);
  const online = { ...product('online', 'atomo-online', 3000), source: 'ONLINE' as const, quantity: 3 };
  const result = applyCatalogComparison([...basket.map(r => r.original), online], best.mapping);
  assert.deepEqual(result.map(r => r.quantity), [2, 1, 3]);
  assert.deepEqual(result[2], online);
});

test('centavos remain exact and ties keep the current branch without charging unused visits', () => {
  const data = [{ original: { ...product('item', 'Z', 0.1), quantity: 3 }, equivalents: [product('item', 'A', 0.1)] }];
  const result = calculateNetScenarios(data, { maxVisits: 3, visitCost: 0.2 });
  assert.equal(result.current.total, 0.5);
  assert.equal(result.scenarios[0].total, 0.5);
  assert.deepEqual(result.scenarios[0].stores, ['Z']);
  assert(result.scenarios.every(s => s.visits === 1));
  assert.equal(result.scenarios[0].mapping[cartKey(data[0].original)].store, 'Z');
});

test('three branches can cover a basket which no pair covers; duplicate offers do not create visits', () => {
  const data = ['A', 'B', 'C'].map((store, i) => ({ original: { ...product(String(i), store, 100), quantity: 1 }, equivalents: [product(String(i), store, 120)] }));
  assert.equal(calculateNetScenarios(data, { maxVisits: 2, visitCost: 0 }).scenarios.length, 0);
  const result = calculateNetScenarios(data, { maxVisits: 3, visitCost: 25 }).scenarios[0];
  assert.equal(result.total, 375); assert.equal(result.visits, 3);
});

test('invalid costs cannot become free travel and the empty basket has no recommendation', () => {
  for (const raw of ['', '-1', '1.000,50', '1e3', 'Infinity', 'NaN', '1000001', '1.234']) assert.equal(parseEstimatedCost(raw), null);
  assert.equal(parseEstimatedCost('1200,50'), 1200.5);
  assert.equal(parseEstimatedCost('0'), 0);
  assert.throws(() => calculateNetScenarios(basket, { maxVisits: 2, visitCost: NaN }));
  assert.deepEqual(calculateNetScenarios([], { maxVisits: 1, visitCost: 0 }).scenarios, []);
});

test('exact search matches an independent exhaustive assignment oracle on small catalogs', () => {
  for (let seed = 1; seed <= 18; seed++) {
    const data = Array.from({ length: 4 }, (_, i) => {
      const choices = ['A', 'B', 'C', 'D'].filter((_, j) => j === 0 || (seed + i + j) % 4 !== 0).map((store, j) => product(String(i), store, 100 + ((seed * (i + 1) * (j + 3)) % 31)));
      return { original: { ...choices[0], quantity: i + 1 }, equivalents: choices.slice(1) };
    });
    for (const maxVisits of [1, 2, 3] as const) {
      let minimum = Infinity;
      function enumerate(index: number, choices: Product[]) {
        if (index === data.length) {
          const visits = new Set(choices.map(p => p.store)).size;
          if (visits <= maxVisits) minimum = Math.min(minimum, choices.reduce((sum, p, i) => sum + p.price * data[i].original.quantity, 0) + visits * 13);
          return;
        }
        for (const p of [data[index].original, ...data[index].equivalents]) enumerate(index + 1, [...choices, p]);
      }
      enumerate(0, []);
      assert.equal(calculateNetScenarios(data, { maxVisits, visitCost: 13 }).scenarios[0].total, minimum, `seed ${seed}, limit ${maxVisits}`);
    }
  }
});
