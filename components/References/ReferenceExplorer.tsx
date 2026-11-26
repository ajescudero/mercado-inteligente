'use client';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { MarketReferences } from './MarketReferences';
import { StoreLogo } from '../Product/StoreLogo';
import { compatibleUnits, compareReference, parseLocalNumber, type ReferenceCategory, type ReferenceUnit } from '@/lib/market-references';
import { matchesVocabulary } from '@/lib/search-vocabulary';
import type { CatalogReferenceRow } from '@/lib/reference-catalog';

const money=(n:number)=>n.toLocaleString('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2});
const date=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('es-AR');
const categories=['Todos','Carnicería','Verdulería','Despensa'] as const;
export function ReferenceExplorer({rows,error,historical,stale}:{rows:CatalogReferenceRow[];error:boolean;historical:boolean;stale:boolean}) {
  const [source,setSource]=useState<'mendoza'|'cuyo'>('mendoza');
  return <>
    <div className="reference-source-switch" role="group" aria-label="Origen de los precios de referencia">
      <button className={source==='mendoza'?'button-primary':'button-secondary'} aria-pressed={source==='mendoza'} onClick={()=>setSource('mendoza')}>Mendoza · Supermercados</button>
      <button className={source==='cuyo'?'button-primary':'button-secondary'} aria-pressed={source==='cuyo'} onClick={()=>setSource('cuyo')}>Cuyo · INDEC</button>
    </div>
    {source==='cuyo'?<MarketReferences historical={historical}/>:<LocalReferences rows={rows} error={error} stale={stale}/>}
  </>;
}
function LocalReferences({rows,error,stale}:{rows:CatalogReferenceRow[];error:boolean;stale:boolean}) {
  const [category,setCategory]=useState<ReferenceCategory|'Todos'>('Todos');
  const [query,setQuery]=useState('');const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<CatalogReferenceRow|null>(null);
  const [price,setPrice]=useState('');const [quantity,setQuantity]=useState('1');const [unit,setUnit]=useState<ReferenceUnit>('kg');
  const [validation,setValidation]=useState('');const [comparison,setComparison]=useState<ReturnType<typeof compareReference>>(null);
  const calculator=useRef<HTMLHeadingElement>(null);const listHeading=useRef<HTMLHeadingElement>(null);
  const matches=rows.filter(row=>matchesVocabulary(row.name,query));
  const visible=matches.filter(row=>category==='Todos'||row.category===category);
  const pages=Math.max(1,Math.ceil(visible.length/24));const current=Math.min(page,pages);
  useLayoutEffect(()=>{if(selected){calculator.current?.focus({preventScroll:true});calculator.current?.scrollIntoView({block:'center'});}},[selected]);
  const select=(row:CatalogReferenceRow)=>{setSelected({...row});setPrice('');setQuantity(String(row.quantity).replace('.',','));setUnit(row.unit);setValidation('');setComparison(null);};
  const calculate=(e:FormEvent)=>{e.preventDefault();const p=parseLocalNumber(price),q=parseLocalNumber(quantity);if(!selected || p===null || q===null){setValidation('Ingresá un importe y una cantidad mayores que cero.');setComparison(null);return;}setComparison(compareReference(selected,p,q,unit));setValidation('');};
  const resetResult=()=>{setComparison(null);setValidation('');};
  const latest=rows[0]?.date;
  return <section className="mt-7" aria-labelledby="local-reference-title">
    <h2 id="local-reference-title" ref={listHeading} tabIndex={-1} className="text-xl font-bold">Precios en supermercados de Mendoza</h2>
    <p className="text-sm text-muted mt-2">{latest?`SEPA · ${date(latest)} · `:''}{rows.length.toLocaleString('es-AR')} productos y presentaciones disponibles.</p>
    <p className="text-sm text-muted mt-3 max-w-prose">Compará cortes, frutas, verduras y productos de despensa. Cada fila conserva la presentación del comercio y resume sus precios informados por sucursal.</p>
    <details className="reference-method"><summary>Qué representa este promedio</summary><p>Promedio simple de las sucursales disponibles para el mismo código, descripción y presentación, en la fecha indicada. Cada sucursal cuenta una vez. No es un promedio oficial de Mendoza ni de Cuyo, ni un relevamiento de carnicerías o verdulerías independientes. No incluye precios online de Átomo ni garantiza stock. Los nombres parecidos, marcas, cortes y envases diferentes permanecen separados.</p></details>
    {stale && <p role="status" className="text-amber-800 mt-3">Estos precios tienen más de una semana. Consultá su vigencia en el comercio.</p>}
    <fieldset className="mt-5"><legend className="sr-only">Rubros del catálogo de Mendoza</legend><div className="flex flex-wrap gap-2">{categories.map(value=><button key={value} aria-pressed={category===value} className={category===value?'button-primary':'button-secondary'} onClick={()=>{setCategory(value);setPage(1);}}>{value} <span className="reference-count">{(value==='Todos'?matches:matches.filter(row=>row.category===value)).length.toLocaleString('es-AR')}</span></button>)}</div></fieldset>
    <div className="mt-4 relative max-w-xl"><label htmlFor="local-reference-search" className="sr-only">Buscar productos de referencia en Mendoza</label><Search size={18} className="absolute left-3 top-3.5 text-muted" aria-hidden="true"/><input id="local-reference-search" type="search" className="field pl-10" placeholder="Buscá carne molida, asado, tomate, arroz…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} maxLength={120}/></div>
    <p role="status" className="text-sm text-muted mt-3">{visible.length.toLocaleString('es-AR')} resultados{visible.length>24?` · Mostrando ${(current-1)*24+1}–${Math.min(current*24,visible.length)}`:''}</p>
    <div className="local-reference-layout">
      <div className="min-w-0">
        {error?<div role="alert" className="reference-empty"><h3>No pudimos leer los precios del catálogo</h3><p>Podés reintentar o consultar la pestaña Cuyo · INDEC.</p><button className="button-secondary" onClick={()=>window.location.reload()}>Reintentar</button></div>:
        !visible.length?<div className="reference-empty"><h3>No hay precios con esa búsqueda</h3><p>Probá otro producto o quitá el rubro seleccionado.</p><button className="button-secondary" onClick={()=>{setCategory('Todos');setQuery('');setPage(1);}}>Limpiar búsqueda</button></div>:
        <ul className="reference-product-list">{visible.slice((current-1)*24,current*24).map(row=><li key={row.id} className={selected?.id===row.id?'is-selected':''}>
          <div className="reference-product-description"><p className="text-xs text-muted">{row.category} · {row.presentation}</p><h3>{row.name}</h3><div className="reference-store-list">{row.stores.slice(0,2).map(store=><StoreLogo key={store} name={store==='COTO CICSA'?'Coto':store} compact badge/>)}{row.stores.length>2 && <span className="text-xs text-muted">y {row.stores.length-2} más</span>}</div><p className="text-xs text-muted mt-2">{row.observations} {row.observations===1?'sucursal':'sucursales'} · {date(row.date)}</p></div>
          <div className="reference-product-price"><p className="text-xs text-muted">{row.observations>1?'Promedio por '+row.presentation:'Precio por '+row.presentation}</p><strong>{money(row.amount)}</strong>{row.minimum!==row.maximum && <p className="text-xs text-muted">Entre {money(row.minimum)} y {money(row.maximum)}</p>}<button className="button-secondary" onClick={()=>select(row)} aria-label={`Comparar mi compra con ${row.name}`}>Comparar mi compra</button><Link href={'/?q='+encodeURIComponent(row.name)} className="reference-offer-link">Ver ofertas<ArrowUpRight size={14} aria-hidden="true"/></Link></div>
        </li>)}</ul>}
        {pages>1 && <nav className="reference-pagination" aria-label="Páginas de referencias"><button className="button-secondary" disabled={current===1} onClick={()=>{setPage(current-1);listHeading.current?.focus();}}>Anterior</button><span>Página {current} de {pages}</span><button className="button-secondary" disabled={current===pages} onClick={()=>{setPage(current+1);listHeading.current?.focus();}}>Siguiente</button></nav>}
      </div>
      <section className="reference-calculator local-reference-calculator" data-has-selection={!!selected} aria-labelledby="local-calculator-title"><h2 id="local-calculator-title" ref={calculator} tabIndex={-1} className="text-xl font-bold">Compará tu compra</h2>
        {!selected?<p className="text-sm text-muted mt-3">Elegí «Comparar mi compra» en un producto. Vas a poder ingresar el importe y la cantidad para contrastarlos con sus precios por sucursal.</p>:<><p className="text-sm font-semibold mt-3">{selected.name}</p><p className="text-sm text-muted mt-2">{selected.presentation} · {selected.observations} {selected.observations===1?'sucursal':'sucursales'}</p><form className="mt-5 space-y-4" onSubmit={calculate} noValidate>
          <div><label className="filter-label" htmlFor="local-quote-price">Importe que te cobran ($)</label><input id="local-quote-price" className="field" inputMode="decimal" value={price} onChange={e=>{setPrice(e.target.value);resetResult();}} aria-invalid={!!validation} aria-describedby={validation?'local-quote-error':undefined}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="filter-label" htmlFor="local-quote-quantity">Cantidad</label><input id="local-quote-quantity" className="field" inputMode="decimal" value={quantity} onChange={e=>{setQuantity(e.target.value);resetResult();}} aria-invalid={!!validation}/></div><div><label className="filter-label" htmlFor="local-quote-unit">Unidad</label><select id="local-quote-unit" className="field" value={unit} onChange={e=>{setUnit(e.target.value as ReferenceUnit);resetResult();}}>{compatibleUnits(selected.unit).map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div>
          {validation && <p role="alert" id="local-quote-error" className="text-red-800 text-sm">{validation}</p>}<button className="button-primary w-full">Comparar precio</button>
        </form><div role="status" className="text-sm mt-5">{comparison?<><p className="text-lg font-bold text-brand-ink">{Math.abs(comparison.percentage)<0.05?'Coincide con la referencia':`${Math.abs(comparison.percentage).toLocaleString('es-AR',{maximumFractionDigits:1})}% ${comparison.percentage>0?'por encima':'por debajo'}`}</p><p className="mt-2">Referencia para tu cantidad: <strong>{money(comparison.equivalentReference)}</strong></p><p className="mt-2 text-muted">Calculado con las sucursales disponibles, {date(selected.date)}. Revisá calidad, marca y presentación.</p></>:<p className="text-muted">Referencia: {money(selected.amount)} por {selected.presentation}.</p>}</div></>}
      </section>
    </div>
  </section>;
}
