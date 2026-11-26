import Database from 'better-sqlite3';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { REFERENCE_PREFIXES, catalogReferenceCategory, referencePresentation, type CatalogReferenceRow } from './reference-catalog';

interface Summary { ean:string; name:string; presentation:string; date:string; amount:number; minimum:number; maximum:number; observations:number; stores:string }
export interface CatalogReferenceData { rows:CatalogReferenceRow[]; error:boolean; stale:boolean }
let cache:{expires:number;value:CatalogReferenceData}|undefined;
/** Read the existing snapshot; no migration, refresh, cache table or write. */
export function getCatalogReferences():CatalogReferenceData {
  if (cache && cache.expires>Date.now()) return cache.value;
  let database:Database.Database|undefined;
  try {
    database=new Database(process.env.PRICES_DB_PATH || path.join(process.cwd(),'shopping-list.db'),{readonly:true,fileMustExist:true});
    const rows=readCatalogReferenceRows(database);
    const stale=!rows[0]?.date || Date.now()-Date.parse(rows[0].date+'T00:00:00Z')>8*86400000;
    const value={rows,error:false,stale};cache={expires:Date.now()+60_000,value};return value;
  } catch {return {rows:[],error:true,stale:false};}
  finally {database?.close();}
}

export function readCatalogReferenceRows(database:Database.Database):CatalogReferenceRow[] {
    const prefixes=[...new Set(Object.values(REFERENCE_PREFIXES).flat())];
    const query=`WITH observations AS (
      SELECT p.ean,p.description AS name,p.storeId,sd.source_date AS date,
        pd.presentation,sd.banner_name AS store,MIN(p.price) AS price
      FROM products p JOIN stores s ON s.id=p.storeId
      JOIN store_details sd ON sd.store_id=p.storeId
      JOIN product_details pd ON pd.ean=p.ean AND pd.description=p.description AND pd.store_id=p.storeId
      WHERE p.price>=100 AND sd.source_date=(SELECT source_date FROM price_update_metadata WHERE id=1)
        AND (${prefixes.map(()=>"p.description LIKE ?").join(' OR ')})
      GROUP BY p.ean,p.description,p.storeId,pd.presentation,sd.source_date,sd.banner_name
    ) SELECT ean,name,presentation,date,AVG(price) AS amount,MIN(price) AS minimum,MAX(price) AS maximum,
      COUNT(*) AS observations,GROUP_CONCAT(DISTINCT store) AS stores
      FROM observations GROUP BY ean,name,presentation,date ORDER BY name`;
    const summaries=database.prepare(query).all(...prefixes.map(prefix=>prefix+'%')) as Summary[];
    const rows:CatalogReferenceRow[]=[];
    for (const item of summaries) {
      const category=catalogReferenceCategory(item.name);
      const size=referencePresentation(item.presentation || '');
      if (!category || !size || !Number.isFinite(item.amount)) continue;
      rows.push({id:'catalog-'+createHash('sha256').update(JSON.stringify([item.ean,item.name,item.presentation,item.date])).digest('hex').slice(0,20),
        name:item.name,category,presentation:item.presentation,...size,amount:item.amount,
        minimum:item.minimum,maximum:item.maximum,observations:item.observations,stores:item.stores.split(','),date:item.date});
    }
    const order=['Carnicería','Verdulería','Despensa'];
    rows.sort((a,b)=>order.indexOf(a.category)-order.indexOf(b.category)||a.name.localeCompare(b.name,'es'));
    return rows;
}
