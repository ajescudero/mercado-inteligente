import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_REFERENCES,compareReference,parseLocalNumber,compatibleUnits,isReferenceHistorical} from '../lib/market-references';

test('normalizes grams, liquids and eggs before comparing a total quote',()=>{
  const picada=MARKET_REFERENCES.find(r=>r.id==='picada')!;
  assert.equal(compareReference(picada,6000,500,'g')!.equivalentReference,5036.725);
  assert.ok(Math.abs(compareReference(picada,6000,500,'g')!.percentage-19.1250495)<0.001);
  const aceite=MARKET_REFERENCES.find(r=>r.id==='aceite')!;
  assert.equal(compareReference(aceite,3000,500,'ml')!.equivalentReference,2307.09);
  const huevos=MARKET_REFERENCES.find(r=>r.id==='huevos')!;
  assert.equal(compareReference(huevos,2000,6,'unidad')!.equivalentReference,1942.72);
  assert.equal(compareReference(picada,100,1,'l'),null);
  assert.equal(compareReference(picada,100,0,'kg'),null);
  assert.equal(compareReference(picada,Infinity,1,'kg'),null);
  assert.deepEqual(compatibleUnits('docena').map(u=>u.value),['unidad','docena']);
});

test('parses Argentine prices without stripping malformed values into plausible prices',()=>{
  for(const text of ['1.500,50','1500,50','1500.50'])assert.equal(parseLocalNumber(text),1500.5);
  assert.equal(parseLocalNumber('10.000'),10000);
  assert.equal(parseLocalNumber('0,5'),0.5);
  for(const text of ['','0','-100','1e3','1,2,3','NaN','12abc','1.50.0','1000000001'])assert.equal(parseLocalNumber(text),null);
});

test('keeps the Cuyo source sample, presentations and historical cutoff explicit',()=>{
  assert.equal(MARKET_REFERENCES.length,14);
  assert.equal(new Set(MARKET_REFERENCES.map(r=>r.id)).size,14);
  assert.equal(MARKET_REFERENCES.find(r=>r.id==='papa')!.amount,2696.27);
  assert.equal(MARKET_REFERENCES.find(r=>r.id==='fideos')!.quantity,500);
  assert.equal(MARKET_REFERENCES.find(r=>r.id==='fideos')!.unit,'g');
  assert.equal(isReferenceHistorical(new Date('2026-11-15T12:00:00-03:00')),false);
  assert.equal(isReferenceHistorical(new Date('2027-01-05T12:00:00-03:00')),true);
});
