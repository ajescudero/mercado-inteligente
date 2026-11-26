import { ATOMO_BRANCHES, ATOMO_RETAILER, withAtomoLocations } from '../lib/atomo-locations';
import { emptyFilters, matchesFilters } from '../lib/catalog-filters';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAtomoProducts } from '../server/supermarkets/atomo-parser';

const checkedAt = '2026-11-15T15:00:00Z';
const row = {
  name: 'LECHE U.A.T. APOSTOLES LIVIANA 2% 1 LTS.', price_amount: 1599,
  url: 'https://atomoconviene.com/atomo-ecommerce/leches-larga-vida/24865-leche.html',
  cover: { bySize: { home_default: { url: 'https://atomoconviene.com/atomo-ecommerce/66453-home_default/leche.jpg' } } },
};

test('online price retains exact decimal amount, official photo and independent source scope', () => {
  const [product] = parseAtomoProducts({ products: [row] }, checkedAt);
  assert.equal(product.price, 1599);
  assert.equal(product.image, row.cover.bySize.home_default.url);
  assert.equal(product.chainId, 'atomo');
  assert.equal(product.store, 'atomo-online');
  assert.equal(product.source, 'ONLINE');
  assert.equal(product.sourceDate, checkedAt);
  assert.equal(product.priceDate, undefined);
  assert.equal(product.ean, undefined);
  assert.equal(product.productType, 'Alimentos');
  assert.equal(product.category, 'Lácteos');
  assert.equal(parseAtomoProducts({ products: [{ ...row, price_amount: '1599.50' }] }, checkedAt)[0].price, 1599.5);
});

test('malformed, duplicate and suspicious source entries do not become offers', () => {
  const products = parseAtomoProducts({ products: [null, {}, row, row,
    { ...row, price_amount: 0.1 }, { ...row, price_amount: 'unavailable' },
    { ...row, url: 'https://unrelated.invalid/product' },
    { ...row, url: 'javascript:alert(1)' }, { ...row, name: '' },
  ] }, checkedAt);
  assert.equal(products.length, 1);
  const [withoutPhoto] = parseAtomoProducts({ products: [{ ...row, cover: { medium: { url: 'https://unrelated.invalid/photo.jpg' } } }] }, checkedAt);
  assert.equal(withoutPhoto.image, undefined);
  const [mismatched] = parseAtomoProducts({ products: [{ ...row, cover: { medium: { url: 'https://atomoconviene.com/atomo-ecommerce/69135-home_default/leche.jpg' } } }] }, checkedAt);
  assert.equal(mismatched.image, undefined);
});


test('the chain includes physical Corralitos without attributing online prices to it', () => {
  const physical=ATOMO_BRANCHES.find(b=>b.id==='atomo-corralitos')!;
  assert.equal(ATOMO_RETAILER.label,'Átomo');
  assert.equal(physical.department,'Guaymallén');
  assert.equal(physical.address,'Severo del Castillo 5723, Los Corralitos');
  assert.equal(physical.kind,'physical');assert.equal(physical.priceStatus,'not-integrated');
  const [online]=parseAtomoProducts({products:[row]},checkedAt);
  assert.equal(matchesFilters(online,{...emptyFilters,branch:physical.id}),false);
  assert.equal(matchesFilters(online,{...emptyFilters,stores:['atomo']}),true);
  const metadata=withAtomoLocations({branches:[],storesAvailable:[]});
  assert.deepEqual(withAtomoLocations(metadata),metadata);
  assert.equal(metadata.branches.length,2);
});
