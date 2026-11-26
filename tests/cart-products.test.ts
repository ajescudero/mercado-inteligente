import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCatalogComparison,catalogCartItems,refreshCatalogCart,type ShoppingCartItem} from '../lib/cart-products';
import {cartKey} from '../lib/cart-optimization';

const online: ShoppingCartItem={id:'https://atomoconviene.com/atomo-ecommerce/producto.html',url:'https://atomoconviene.com/atomo-ecommerce/producto.html',name:'Limpiador de piso',price:1500.50,quantity:2,store:'atomo-online',source:'ONLINE',sourceDate:'2026-11-15T15:00:00Z',storeLabel:'Átomo online',image:'https://atomoconviene.com/atomo-ecommerce/imagen.jpg'};
const sepa: ShoppingCartItem={id:'sepa-original',name:'Leche',price:2000,quantity:3,store:'branch-a',source:'SEPA'};

test('refreshes only catalog items and keeps online snapshots through storage and refresh',()=>{
  const saved=JSON.parse(JSON.stringify([online,sepa])) as ShoppingCartItem[];
  assert.deepEqual(catalogCartItems(saved).map(p=>p.id),[sepa.id]);
  assert.deepEqual(catalogCartItems([online]),[]);
  assert.deepEqual(catalogCartItems([{...online,source:undefined}]),[]);
  const refreshed=refreshCatalogCart(saved,[{id:online.id,product:null},{id:sepa.id,product:{...sepa,price:1900}}]);
  assert.deepEqual(refreshed[0],online);
  assert.equal(refreshed[0].unavailable,undefined);
  assert.equal(refreshed[1].quantity,3);
  assert.equal(refreshed[1].price,1900);
  assert.equal(refreshed.reduce((sum,p)=>sum+p.price*p.quantity,0),8701);
});

test('missing SEPA offers are still marked unavailable while online offers remain usable',()=>{
  const refreshed=refreshCatalogCart([online,sepa],[{id:sepa.id,product:null}]);
  assert.deepEqual(refreshed[0],online);
  assert.equal(refreshed[1].unavailable,true);
});

test('applying a branch comparison never removes or replaces online list entries',()=>{
  const cheaper={...sepa,id:'sepa-cheaper',store:'branch-b',price:1700};
  const result=applyCatalogComparison([online,sepa],{[cartKey(sepa)]:cheaper,[cartKey(online)]:cheaper});
  assert.deepEqual(result[0],online);
  assert.equal(result[1].id,cheaper.id);
  assert.equal(result[1].quantity,3);
  assert.equal(result.reduce((sum,p)=>sum+p.price*p.quantity,0),8101);
  assert.deepEqual(applyCatalogComparison([online],{}),[online]);
});
