import { storeLocation } from '../lib/store-location';
import locations from '../data/branch-locations.json';
import { test, before, after } from 'node:test';
import { emptyFilters, matchesFilters, groupProducts, buildFacets, parseFilters, filterParams, unitPrice } from '../lib/catalog-filters';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { matchingImage } from '../lib/product-image-source';
import { classifyProduct } from '../lib/product-category';
import { productImageUrl } from '../lib/product-image';
import { calculateScenarios, type EquivalentResult } from '../lib/cart-optimization';

let catalog: typeof import('../lib/catalog');
let database: typeof import('../lib/db');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'precios-test-'));
process.env.PRICES_DB_PATH = path.join(dir, 'fixture.db');
before(async () => {
  const db = new Database(process.env.PRICES_DB_PATH!);
  db.exec(`CREATE TABLE products (ean TEXT, description TEXT, price REAL, storeId TEXT, comercioId TEXT);
    CREATE TABLE stores (id TEXT, comercioId TEXT, name TEXT, address TEXT, locality TEXT);
    CREATE TABLE store_details (store_id TEXT PRIMARY KEY, banner_id TEXT, banner_name TEXT, prices_updated_at TEXT, source_date TEXT);
    CREATE TABLE product_details (ean TEXT, description TEXT, store_id TEXT, brand TEXT, presentation TEXT, PRIMARY KEY(ean,description,store_id));
    INSERT INTO store_details VALUES ('10-1-1', '10-1', 'Carrefour', '2026-11-14T08:00:00-03:00', '2026-11-14'), ('12-1-1', '12-1', 'Coto', '2026-11-14T09:00:00-03:00', '2026-11-14');
    CREATE TABLE price_update_metadata (id INTEGER, source_date TEXT);
    INSERT INTO price_update_metadata VALUES (1, '2026-11-14');
    INSERT INTO stores VALUES ('10-1-1','10','Vea','Calle 1','Mendoza'), ('12-1-1','12','Carrefour','Calle 2','Mendoza');`);
  const insert = db.prepare('INSERT INTO products VALUES (?,?,?,?,?)');
  insert.run('7791234567898', 'LECHE ENTERA 1L', 1200, '10-1-1', '10');
  insert.run('7791234567898', 'LECHE ENTERA 1 LITRO', 1000, '12-1-1', '12');
  insert.run('7799876543219', 'LECHE ENTERA 500ML', 600, '12-1-1', '12');
  insert.run('local:10:1:42', 'PAN', 800, '10-1-1', '10');
  insert.run('local:12:1:42', 'JABON', 400, '12-1-1', '12');
  insert.run('local:10:1:badprice', 'ARROZ ALBONDIGAS', 0.1, '10-1-1', '10');
  insert.run('local:10:1:candy', 'ALFAJOR DULCE DE LECHE 40 G', 300, '10-1-1', '10');
  insert.run('7798124362731', 'ECOVITA PISOS LAVANDA ECOSMART DP 27ML', 599, '10-1-1', '10');
  insert.run('7791130963367', 'LIMPIADOR LIQ.P/PISO TROPICAL PROCENEX BOT 900 ML', 2620.99, '12-1-1', '12');
  // Meat search regression fixtures; never written to the real price database.
  insert.run('local:10:1:meat-special', 'PICADA ESPECIAL NOVILLITO X KG', 12500, '10-1-1', '10');
  insert.run('local:12:1:meat-special', 'MOLIDA ESPECIAL X KG', 13900, '12-1-1', '12');
  insert.run('local:10:1:meat-common', 'PICADA COMUN X KG', 6999, '10-1-1', '10');
  insert.run('local:10:1:ground-spice', 'PIMIENTA MOLIDA ESPECIAL 25 G', 1500, '10-1-1', '10');
  insert.run('local:10:1:grinder', 'PICADORA DE CARNE ESPECIAL', 80000, '10-1-1', '10');
  insert.run('local:10:1:coldcuts', 'PICADA DE FIAMBRES ESPECIAL', 25000, '10-1-1', '10');
  for (let i=0;i<1200;i++) insert.run('local:10:1:test'+i, 'DETERGENTE PRUEBA '+i, 100+i, '10-1-1', '10');
  insert.run('local:12:1:test-last', 'DETERGENTE PRUEBA FINAL', 50000, '12-1-1', '12');
  db.exec("INSERT INTO product_details VALUES ('7798124362731', 'ECOVITA PISOS LAVANDA ECOSMART DP 27ML', '10-1-1', 'ECOVITA', '27 ml')");
  db.close();
  catalog = await import('../lib/catalog');
  database = await import('../lib/db');
});
after(() => { database.db.close(); fs.rmSync(dir, { recursive: true }); });

test('search uses the catalog and keeps source date and distinct branches', () => {
  const result = catalog.searchCatalog('leche');
  assert.equal(result.products.length, 3);
  assert.equal(result.metadata.sourceDate, '2026-11-14');
  assert.equal(new Set(result.products.map(p => p.id)).size, 3);
  assert.equal(result.products[0].price, 600);
  assert.equal(catalog.searchCatalog("%' OR 1=1 --").products.length, 0);
  assert.equal(catalog.searchCatalog('%').products.length, 0);
});
test('comparison matches the identifier, not similar descriptions or sizes', () => {
  const product = catalog.searchCatalog('leche').products.find(p => p.store === '10-1-1')!;
  const equivalents = catalog.findCatalogEquivalents(product);
  assert.equal(equivalents.length, 2);
  assert(equivalents.every(p => p.ean === product.ean));
  assert(!equivalents.some(p => p.name.includes('500ML')));
  assert.equal(catalog.getCatalogProduct(product.id)?.price, 1200);
  assert.equal(catalog.getCatalogProduct('invalid'), undefined);
  const internal = catalog.searchCatalog('pan').products[0];
  assert.equal(catalog.findCatalogEquivalents(internal).length, 1);
  assert.deepEqual(catalog.findCatalogEquivalents({ ...product, ean: '1' }), []);
});
test('single-branch scenarios require every product and account for quantity', () => {
  const milk = catalog.searchCatalog('leche').products.find(p => p.store === '10-1-1')!;
  const bread = catalog.searchCatalog('pan').products[0];
  const results: EquivalentResult[] = [
    { original: { ...milk, quantity: 2 }, equivalents: catalog.findCatalogEquivalents(milk) },
    { original: { ...bread, quantity: 1 }, equivalents: catalog.findCatalogEquivalents(bread) },
  ];
  const scenarios = calculateScenarios(results);
  assert.equal(scenarios[0].total, 2800);
  assert.equal(scenarios[0].savings, 400);
  assert(!scenarios.some(s => s.id === 'store:12-1-1'));
  assert(scenarios.some(s => s.id === 'store:10-1-1' && s.total === 3200));
});

test('search intent, official retailer labels, package sizes and image identity', () => {
  const milk = catalog.searchCatalog('leche');
  assert(milk.products.every(p => !p.name.includes('ALFAJOR')));
  assert(milk.products.some(p => p.storeLabel === 'Carrefour' && p.store.startsWith('10-')));
  assert(milk.products.some(p => p.storeLabel === 'Coto' && p.store.startsWith('12-')));
  assert.equal(catalog.searchCatalog('dulce de leche').products.length, 1);
  const floor = catalog.searchCatalog('desodorante de piso');
  assert.equal(floor.products.length, 2);
  const refill = floor.products.find(p => p.ean === '7798124362731')!;
  assert.equal(refill.presentation, '27 ml');
  assert.equal(refill.priceDate, '2026-11-14');
  assert.equal(refill.image, 'https://imagenes.preciosclaros.gob.ar/productos/7798124362731.jpg');
  assert.equal(productImageUrl('local:10:1:42'), undefined);
  assert.equal(productImageUrl('7798124362732'), undefined);
  assert.equal(catalog.searchCatalog('de la').products.length, 0);
});

test('rejects suspect prices and wrong-SKU photos; classifies Spanish product types', () => {
  assert.equal(catalog.searchCatalog('arroz albondigas').products.length, 0);
  assert.equal(catalog.getCatalogMetadata().excludedPrices, 1);
  const unsafe = [{ items: [{ ean: '7791058000816', images: [{ imageUrl: 'https://jumboargentina.vteximg.com.br/wrong.jpg' }] }] }];
  assert.equal(matchingImage(unsafe, '7791058000731'), null);
  const exact = [{ items: [{ ean: '7791058000731', images: [{ imageUrl: 'https://jumboargentina.vteximg.com.br/milk.jpg' }] }] }];
  assert.equal(matchingImage(exact, '7791058000731'), 'https://jumboargentina.vteximg.com.br/milk.jpg');
  exact[0].items[0].images[0].imageUrl = 'https://unrelated.invalid/image.jpg';
  assert.equal(matchingImage(exact, '7791058000731'), null);
  assert.equal(classifyProduct('DESODORANTE PARA PISOS LAVANDA 900 ML').productType, 'Limpieza');
  assert.equal(classifyProduct('LECHE ENTERA 1L').category, 'Lácteos');
  assert.equal(classifyProduct('LECHE DE LIMPIEZA FACIAL').productType, 'Cuidado personal');
  assert.equal(classifyProduct('ARROZ LARGO FINO 1 KG').productType, 'Alimentos');
});


test('filters and facets include offers beyond the former 1000-row limit', () => {
  const all=catalog.searchCatalogAll('detergente prueba');
  assert.equal(all.length,1201);
  const filters={...emptyFilters,branch:'12-1-1'};
  const selected=all.filter(p=>matchesFilters(p,filters));
  assert.equal(selected.length,1);assert.equal(selected[0].price,50000);
  assert.equal(groupProducts(selected,'detergente prueba','relevance').length,1);
  const facets=buildFacets(all,emptyFilters);
  assert.equal(facets.branches['10-1-1'],1200);assert.equal(facets.branches['12-1-1'],1);
  assert.equal(facets.types.Limpieza,1201);
  assert.equal(catalog.searchCatalog('detergente prueba').products.length,1000);
});
test('grouping preserves product identity, canonical branch offers and scoped local codes', () => {
  const milk=catalog.searchCatalogAll('leche');
  const groups=groupProducts(milk,'leche','price-asc');
  assert.equal(groups.length,2);
  const oneLiter=groups.find(g=>g.product.ean==='7791234567898')!;
  assert.equal(oneLiter.offerCount,2);assert.equal(oneLiter.product.price,1000);
  assert.equal(new Set(oneLiter.offers.map(p=>p.id)).size,2);
  const local=[catalog.searchCatalog('pan').products[0],catalog.searchCatalog('jabon').products[0]];
  assert.equal(groupProducts(local,'','relevance').length,2);
  assert.equal(unitPrice({...milk[0],price:599,presentation:'27 ml'})?.unit,'L');
  assert.equal(unitPrice({...milk[0],price:1200,presentation:'500 g'})?.price,2400);
  assert.equal(unitPrice({...milk[0],presentation:'6 x 1 L'}),undefined);
});
test('filters validate boundaries and survive URL encoding', () => {
  const filters={...emptyFilters,types:['Limpieza','Cuidado personal'],categories:['Pisos y superficies'],department:'50056',stores:['atomo','vea'],minPrice:123.45,maxPrice:9999};
  assert.deepEqual(parseFilters(filterParams(filters)),filters);
  for (const raw of ['min=2000&max=1000','min=-1','max=Infinity','min=abc']) assert.throws(()=>parseFilters(new URLSearchParams(raw)));
  const all=catalog.searchCatalogAll('detergente prueba');
  const facets=buildFacets(all,{...emptyFilters,stores:['coto']});
  assert(facets.stores.carrefour>1000); // other chains remain selectable
});


test('department mapping is guarded by coordinates and address; conflicts remain explicit', () => {
  const reference=locations['10-3-863'];
  const branch={id:'10-3-863',address:reference.address,lat:reference.lat,lng:reference.lng};
  assert.equal(storeLocation(branch).department,'Lavalle');
  assert.equal(storeLocation({...branch,address:'Changed address'}).departmentId,'unknown');
  assert.equal(storeLocation({...branch,lat:0}).departmentId,'unknown');
  const conflict=locations['9-1-401'];
  assert.equal(storeLocation({id:'9-1-401',address:conflict.address,lat:conflict.lat,lng:conflict.lng}).departmentId,'unknown');
});


test('online search applies the same intent and rejects unrelated floor accessories and sweets', () => {
  const product=catalog.searchCatalog('desodorante de piso').products[0];
  const names=['TRAPO DE PISO 1 UNID.','DESODORANTE AMBIENTAL','LIMPIADOR PISOS LAVANDA 900 ML','ECOVITA PISOS LAVANDA 27 ML'];
  const online=names.map((name,i)=>({...product,id:String(i),source:'ONLINE' as const,name}));
  assert.deepEqual(catalog.filterCatalogMatches(online,'desodorante de piso').map(p=>p.name),names.slice(2));
  const milk=['LECHE ENTERA 1 L','ALFAJOR DULCE DE LECHE','LECHE DESCREMADA 1 L'].map(name=>({...product,name}));
  assert.equal(catalog.filterCatalogMatches(milk,'leche').length,2);
});


test('molida especial finds picada especial without losing qualifiers or branch filters', () => {
  const expected=['PICADA ESPECIAL NOVILLITO X KG','MOLIDA ESPECIAL X KG'];
  for (const query of ['molida especial','carne molida especial','picada especial']) {
    const products=catalog.searchCatalogAll(query);
    assert.deepEqual(products.map(p=>p.name).sort(),[...expected].sort());
    assert(products.every(p=>p.productType==='Alimentos'));
    const special=products.find(p=>p.name===expected[0])!;
    assert.equal(special.price,12500);
    assert.equal(special.priceDate,'2026-11-14');
    const filters={...emptyFilters,types:['Alimentos'],stores:['carrefour']};
    assert.deepEqual(products.filter(p=>matchesFilters(p,filters)).map(p=>p.name),expected.slice(0,1));
    assert.equal(buildFacets(products,emptyFilters).stores.carrefour,1);
    assert.equal(buildFacets(products,emptyFilters).stores.coto,1);
  }
  assert.deepEqual(catalog.searchCatalog('molida especial novillito').products.map(p=>p.name),expected.slice(0,1));
  assert.deepEqual(catalog.searchCatalog('pimienta molida especial').products.map(p=>p.name),['PIMIENTA MOLIDA ESPECIAL 25 G']);
  assert.equal(catalog.searchCatalog('molida especial inexistente').products.length,0);
  const seed=catalog.searchCatalog('leche').products[0];
  const online=['PICADA ESPECIAL X KG','PICADA COMUN X KG','PICADORA DE CARNE ESPECIAL'].map(name=>({...seed,name,source:'ONLINE' as const}));
  assert.deepEqual(catalog.filterCatalogMatches(online,'molida especial').map(p=>p.name),['PICADA ESPECIAL X KG']);
});
