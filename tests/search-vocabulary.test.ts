import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { catalogQuery } from '../lib/catalog-query';
import { matchesVocabulary, atomoSearchTerm, SEARCH_VOCABULARY } from '../lib/search-vocabulary';
import { catalogReferenceCategory, referencePresentation } from '../lib/reference-catalog';

const products=['CARNE NOVILLO LIBERTADOR MOLIDA X 500 G','PICADA ESPECIAL X KG','CARNE PICADA COMÚN X KG','PICADA CONGELADA X 500 GRS','PICADA DE FIAMBRES X KG','PIMIENTA MOLIDA ESPECIAL 25 G','ALIMENTO PERRO CARNE MOLIDA','PICADORA DE CARNE','MORRÓN ROJO X KG','PIMIENTO ROJO X KG','PIMIENTO VERDE X KG','PIMENTON MOLIDO','YOGUR NATURAL 190 G','YOGURT NATURAL 190 G'];
function sqlMatches(query:string) {
  const db=new Database(':memory:');
  try {const q=catalogQuery(query);const stmt=db.prepare(`SELECT 1 FROM (SELECT ? AS description) p WHERE ${q.where}`);return products.filter(name=>!!stmt.get(name,...q.params));}
  finally {db.close();}
}
test('regional meat names share results and keep brand, type and size qualifiers',()=>{
  const expected=products.slice(0,4);
  for(const q of ['carne molida','carne picada','molida','picada']) {
    assert.deepEqual(sqlMatches(q),expected);
    assert.deepEqual(products.filter(p=>matchesVocabulary(p,q)),expected);
  }
  assert.deepEqual(sqlMatches('molida especial'),[products[1]]);
  assert.deepEqual(sqlMatches('molida común'),[products[2]]);
  assert.deepEqual(sqlMatches('picada libertador 500'),[products[0]]);
  assert.deepEqual(sqlMatches('pimienta molida especial'),[products[5]]);
  assert.equal(atomoSearchTerm('carne picada especial'),'molida especial');
  assert.equal(atomoSearchTerm('carne picada libertador 500'),'molida libertador 500');
  assert.equal(atomoSearchTerm('pimienta molida'),'pimienta molida');
  assert.equal(SEARCH_VOCABULARY[0].regionalNames.Mendoza,'carne molida');
});
test('reviewed produce and spelling aliases preserve color and product type',()=>{
  assert.deepEqual(sqlMatches('morrón rojo'),products.slice(8,10));
  assert.deepEqual(sqlMatches('pimiento rojo'),products.slice(8,10));
  assert.deepEqual(sqlMatches('yogur natural'),products.slice(12));
  assert.deepEqual(sqlMatches('yogurt natural'),products.slice(12));
  assert.equal(matchesVocabulary('PIMIENTO EN POLVO','morrón'),false);
});
test('reference rubrics exclude lookalike nonfoods and preserve presentations',()=>{
  for(const name of ['ASADO X KG','VACIO NOVILLO X KG','PICADA CONGELADA X 500 GRS'])assert.equal(catalogReferenceCategory(name),'Carnicería');
  for(const name of ['PAPA BLANCA X KG','ZANAHORIA X KG','TOMATE PERITA X KG','MORRÓN ROJO X KG'])assert.equal(catalogReferenceCategory(name),'Verdulería');
  for(const name of ['ACEITE 10W40 SEMISINTETICO 4 X 4 L','ALITAS Y TUTU BAT','HUEVO CHOCOLATE 100 G','PICADA DE FIAMBRES','ADEREZO SABOR ASADO','TOMATE TRITURADO 400 G'])assert.equal(catalogReferenceCategory(name),null,name);
  assert.deepEqual(referencePresentation('500 g'),{quantity:500,unit:'g'});
  assert.deepEqual(referencePresentation('1,5 L'),{quantity:1.5,unit:'l'});
  assert.equal(referencePresentation('6 x 1 L'),null);
});
