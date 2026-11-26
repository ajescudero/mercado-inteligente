'use client';

import { matchesVocabulary } from '@/lib/search-vocabulary';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { MARKET_REFERENCES, REFERENCE_SOURCE, REFERENCE_SOURCES, compatibleUnits, compareReference, parseLocalNumber, type ReferenceCategory, type ReferenceUnit } from '@/lib/market-references';

const currency=(value:number)=>value.toLocaleString('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2});
const categories=['Todos','Carnicería','Verdulería','Despensa'] as const;

export function MarketReferences({historical}:{historical:boolean}) {
  const [category,setCategory]=useState<ReferenceCategory|'Todos'>('Todos');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState('picada');
  const [price,setPrice]=useState('');const [quantity,setQuantity]=useState('1');
  const [unit,setUnit]=useState<ReferenceUnit>('kg');
  const [error,setError]=useState('');
  const [comparison,setComparison]=useState<ReturnType<typeof compareReference>>(null);
  const calculator=useRef<HTMLHeadingElement>(null);
  const reference=MARKET_REFERENCES.find(item=>item.id===selected)!;
  const rows=MARKET_REFERENCES.filter(item=>(category==='Todos'||item.category===category) && matchesVocabulary(item.name,query));
  const sources=REFERENCE_SOURCES.filter(source=>category==='Todos'||source.category===category);

  const selectProduct=(id:string,focus=false)=>{
    const next=MARKET_REFERENCES.find(item=>item.id===id)!;
    setSelected(id);setQuantity(String(next.quantity).replace('.',','));setUnit(next.unit);setPrice('');setError('');setComparison(null);
    if(focus){calculator.current?.focus({preventScroll:true});calculator.current?.scrollIntoView({block:'center',behavior:'auto'});}
  };
  const calculate=(event:FormEvent)=>{
    event.preventDefault();const amount=parseLocalNumber(price);const size=parseLocalNumber(quantity);
    if(amount===null || size===null){setComparison(null);setError('Ingresá un importe y una cantidad mayores que cero. Podés usar coma para los decimales.');return;}
    const result=compareReference(reference,amount,size,unit);
    if(!result){setError('Revisá la unidad y la cantidad de la compra.');setComparison(null);return;}
    setError('');setComparison(result);
  };
  const changeInput=(setter:(value:string)=>void,value:string)=>{setter(value);setError('');setComparison(null);};

  return <>
    <section aria-labelledby="reference-table-title" className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="reference-table-title" className="text-xl font-bold">Precios promedio de Cuyo</h2>
        <a href={REFERENCE_SOURCE.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm text-brand-ink underline underline-offset-4">Ver informe INDEC (PDF)<ArrowUpRight size={16} aria-hidden="true"/><span className="sr-only">, abre otra pestaña</span></a>
      </div>
      <p className="text-sm text-muted"><strong>{REFERENCE_SOURCE.period}</strong> · Publicado el 12/11/2026 · Pesos argentinos</p>
      <p className="text-sm text-muted mt-2 max-w-prose">Cuyo incluye Mendoza, San Juan y San Luis. Son promedios mensuales: orientan la comparación, pero no son precios de hoy ni precios sugeridos de venta.</p>
      {historical && <p role="status" className="mt-3 text-amber-900 bg-amber-50 p-3 rounded-lg">Este relevamiento tiene más de dos meses. Usalo como dato histórico y <a className="underline" href={REFERENCE_SOURCE.latestUrl} target="_blank" rel="noopener noreferrer">consultá la publicación más reciente</a>.</p>}
      <fieldset className="mt-5"><legend className="sr-only">Filtrar referencias por rubro</legend><div className="flex flex-wrap gap-2">{categories.map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)} className={category===value?'button-primary':'button-secondary'}>{value}</button>)}</div></fieldset>
      <div className="mt-4 relative max-w-xl"><label htmlFor="reference-search" className="sr-only">Buscar una referencia</label><Search size={18} className="absolute left-3 top-3.5 text-muted" aria-hidden="true"/><input id="reference-search" value={query} onChange={e=>setQuery(e.target.value)} type="search" maxLength={100} placeholder="Buscá papa, carne picada, leche…" className="field pl-10"/></div>
      <p role="status" className="text-sm text-muted mt-3">{rows.length} {rows.length===1?'referencia disponible':'referencias disponibles'}{category==='Verdulería'?' · Esta tabla incluye papa y huevos. Más verduras en las fuentes de abajo.':''}</p>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-7 lg:gap-9 mt-4 items-start">
        <div className="min-w-0">
          {rows.length?<table className="reference-table w-full table-fixed border-collapse text-sm sm:text-base">
            <caption className="sr-only">Promedios de Cuyo en octubre de 2026. Elegí un producto para comparar tu compra.</caption>
            <thead><tr className="border-y border-line text-muted"><th scope="col" className="py-3 pr-2 text-left font-medium w-[57%]">Producto y presentación</th><th scope="col" className="py-3 pl-2 text-right font-medium">Promedio</th></tr></thead>
            <tbody>{rows.map(item=><tr key={item.id} className={`border-b border-line ${selected===item.id?'bg-brand-soft':''}`}>
              <th scope="row" className="text-left font-normal pr-2"><button type="button" aria-pressed={selected===item.id} aria-label={`Comparar ${item.name}`} className="min-h-16 w-full text-left py-3 px-2 rounded-md text-brand-ink hover:bg-brand-soft" onClick={()=>selectProduct(item.id,true)}><span className="block font-semibold underline decoration-brand underline-offset-4">{item.name}</span><span className="block text-xs sm:text-sm text-muted mt-1">{item.presentation}</span></button></th>
              <td className="text-right px-2 py-3 font-semibold tabular-nums whitespace-nowrap">{currency(item.amount)}</td>
            </tr>)}</tbody>
          </table>:<div className="py-8 border-y border-line"><h3 className="font-semibold">No hay una referencia para esa búsqueda</h3><p className="mt-2 text-sm text-muted">El informe incluye 14 productos. Consultá las fuentes de abajo para ampliar la búsqueda.</p><button type="button" className="button-secondary mt-4" onClick={()=>{setQuery('');setCategory('Todos');}}><X size={16} aria-hidden="true"/>Limpiar búsqueda</button></div>}
          <p className="text-xs text-muted leading-relaxed mt-4">Fuente: {REFERENCE_SOURCE.name}, página 12, columna Cuyo. Selección completa de 14 artículos. La calidad, la marca y la presentación pueden diferir entre comercios. No se mezclan datos de otras regiones.</p>
        </div>
        <section aria-labelledby="quote-title" className="reference-calculator lg:sticky lg:top-28">
          <h2 ref={calculator} id="quote-title" tabIndex={-1} className="text-xl font-bold">Compará tu compra</h2>
          <p className="text-sm text-muted mt-2">Ingresá el importe total y cuánto llevás.</p>
          <form className="mt-5 space-y-4" onSubmit={calculate} noValidate>
            <div><label htmlFor="reference-product" className="filter-label">Producto</label><select id="reference-product" className="field" value={selected} onChange={e=>selectProduct(e.target.value)}>{MARKET_REFERENCES.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div><label htmlFor="quote-price" className="filter-label">Importe que te cobran ($)</label><input id="quote-price" className="field" type="text" inputMode="decimal" maxLength={20} value={price} placeholder="Ingresá el importe" onChange={e=>changeInput(setPrice,e.target.value)} aria-invalid={!!error} aria-describedby={error?'quote-error':undefined}/></div>
            <div className="grid grid-cols-2 gap-3"><div><label htmlFor="quote-quantity" className="filter-label">Cantidad</label><input id="quote-quantity" className="field" type="text" inputMode="decimal" maxLength={20} value={quantity} onChange={e=>changeInput(setQuantity,e.target.value)} aria-invalid={!!error} aria-describedby={error?'quote-error':undefined}/></div><div><label htmlFor="quote-unit" className="filter-label">Unidad</label><select id="quote-unit" className="field" value={unit} onChange={e=>{setUnit(e.target.value as ReferenceUnit);setComparison(null);setError('');}}>{compatibleUnits(reference.unit).map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div>
            {error && <p id="quote-error" role="alert" className="text-sm text-red-800">{error}</p>}
            <button className="button-primary w-full" type="submit">Comparar precio</button>
          </form>
          <div role="status" aria-live="polite" className="mt-5 text-sm">
            {comparison?<div className="border-t border-line pt-4"><p className="text-lg font-bold text-brand-ink">{Math.abs(comparison.percentage)<0.05?'Coincide con la referencia':`${Math.abs(comparison.percentage).toLocaleString('es-AR',{maximumFractionDigits:1})}% ${comparison.percentage>0?'por encima':'por debajo'} de la referencia`}</p><dl className="mt-3 space-y-2"><div className="flex justify-between gap-3"><dt>Referencia para tu cantidad</dt><dd className="font-semibold tabular-nums whitespace-nowrap">{currency(comparison.equivalentReference)}</dd></div><div className="flex justify-between gap-3"><dt>Diferencia de tu compra</dt><dd className="font-semibold tabular-nums whitespace-nowrap">{comparison.difference>0?'+':''}{currency(comparison.difference)}</dd></div></dl><p className="text-muted mt-3">Comparación con {REFERENCE_SOURCE.period.toLowerCase()}, Cuyo{historical?' (dato histórico)':''}. La diferencia no determina por sí sola si un precio es caro: revisá calidad, fecha y presentación.</p></div>:<p className="text-muted">Referencia: <strong className="text-ink">{currency(reference.amount)} / {reference.presentation}</strong><br/>{REFERENCE_SOURCE.period} · Cuyo</p>}
          </div>
          <Link className="inline-flex min-h-11 items-center gap-1 text-sm text-brand-ink underline underline-offset-4 mt-3" href={'/?q='+encodeURIComponent(reference.name)}>Buscar en supermercados<ArrowUpRight size={16} aria-hidden="true"/></Link>
        </section>
      </div>
    </section>
    <section aria-labelledby="sources-title" className="mt-12 border-t border-line pt-8">
      <h2 id="sources-title" className="text-xl font-bold">Otras fuentes para consultar</h2>
      <p className="text-sm text-muted mt-2 max-w-prose">Revisá qué zona, fecha y tipo de precio publica cada sitio. Los importes de estas fuentes se consultan fuera de la app.</p>
      <div className="mt-5 divide-y divide-line">{sources.map(source=><article key={source.id} className="py-5 grid sm:grid-cols-[12rem_minmax(0,1fr)_auto] gap-3 sm:gap-6">
        <div><p className="text-sm font-semibold">{source.kind}</p><p className="text-sm text-muted mt-1">{source.region}</p></div>
        <div className="max-w-prose"><h3 className="font-semibold">{source.name}</h3><p className="text-sm mt-1">{source.description}</p><p className="text-sm text-muted mt-2">{source.date}. {source.note}</p></div>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start gap-1 text-sm font-semibold text-brand-ink underline underline-offset-4">Consultar<ArrowUpRight size={16} aria-hidden="true"/><span className="sr-only"> {source.name}, abre otra pestaña</span></a>
      </article>)}</div>
      {category==='Despensa' && <p className="py-5 text-sm text-muted">Para despensa, usá los promedios de la tabla y contrastalos con los <Link href="/" className="text-brand-ink underline">precios por sucursal de supermercados</Link>.</p>}
      <details className="mt-5 text-sm text-muted"><summary className="min-h-11 py-3 cursor-pointer font-semibold text-ink">Cómo se mantienen estas referencias</summary><div className="space-y-2 max-w-prose pb-3"><p>Verificadas el 15/11/2026. Esta versión incorpora el informe del INDEC de octubre de 2026; no actualiza los valores automáticamente. Si pasan más de dos meses desde el período relevado, se muestra un aviso de dato histórico.</p><p>No aplicamos un margen fijo al costo mayorista para inventar un precio de venta sugerido. La tabla y la calculadora usan sólo el relevamiento minorista de Cuyo.</p><a className="inline-flex min-h-11 items-center text-brand-ink underline" href={REFERENCE_SOURCE.latestUrl} target="_blank" rel="noopener noreferrer">Consultar la publicación más reciente del INDEC<span className="sr-only">, abre otra pestaña</span></a></div></details>
    </section>
  </>;
}
