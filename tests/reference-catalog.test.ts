import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { readCatalogReferenceRows } from '../lib/reference-catalog-server';
import { compareReference } from '../lib/market-references';

test('local reference averages retain identity, presentation, date and one price per branch',()=>{
 const db=new Database(':memory:');
 try {
  db.exec(`CREATE TABLE products(ean TEXT,description TEXT,price REAL,storeId TEXT,PRIMARY KEY(ean,description,storeId));CREATE TABLE stores(id TEXT);CREATE TABLE store_details(store_id TEXT,source_date TEXT,banner_name TEXT);CREATE TABLE product_details(ean TEXT,description TEXT,store_id TEXT,presentation TEXT,PRIMARY KEY(ean,description,store_id));CREATE TABLE price_update_metadata(id INTEGER,source_date TEXT);INSERT INTO price_update_metadata VALUES(1,'2026-11-22');`);
  for(const [id,date] of [['a','2026-11-22'],['b','2026-11-22'],['c','2026-11-22'],['old','2026-10-01']]){db.prepare('INSERT INTO stores VALUES(?)').run(id);db.prepare('INSERT INTO store_details VALUES(?,?,?)').run(id,date,'Carrefour');}
  const add=(ean:string,name:string,price:number,store:string,size:string)=>{db.prepare('INSERT INTO products VALUES(?,?,?,?)').run(ean,name,price,store);db.prepare('INSERT INTO product_details VALUES(?,?,?,?)').run(ean,name,store,size);};
  add('same','PICADA ESPECIAL',5000,'a','500 g');add('same','PICADA ESPECIAL',6000,'b','500 g');
  add('same','PICADA ESPECIAL',3000,'old','500 g');
  add('other','PICADA COMUN',4000,'a','500 g');
  add('local:a','ASADO',10000,'a','1 kg');add('local:b','ASADO',20000,'b','1 kg');
  add('same','PICADA ESPECIAL',11000,'c','1 kg');
  add('invalid','PAPA BLANCA',20,'a','1 kg');
  add('pack','ARROZ BLANCO',10000,'a','6 x 1 kg');
  const rows=readCatalogReferenceRows(db);
  const picada=rows.find(r=>r.name==='PICADA ESPECIAL' && r.presentation==='500 g')!;
  // Different branch presentations stay separate instead of averaging kg with 500 g.
  assert.equal(rows.filter(r=>r.name==='ASADO').length,2);
  assert.equal(rows.filter(r=>r.name==='PICADA ESPECIAL').length,2);
  assert.equal(rows.some(r=>r.name==='PAPA BLANCA'||r.name==='ARROZ BLANCO'),false);
  assert.equal(picada.date,'2026-11-22');assert.equal(picada.observations,2);
  assert.equal(picada.minimum,5000);assert.equal(picada.maximum,6000);assert.equal(picada.amount,5500);
  assert.equal(compareReference(picada,10000,1,'kg')!.equivalentReference,11000);
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 } finally {db.close();}
});
