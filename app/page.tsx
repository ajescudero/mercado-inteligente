'use client';
import { ATOMO_BRANCHES, ATOMO_RETAILER, ATOMO_DIRECTORY_URL } from '@/lib/atomo-locations';
import { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { SidebarFilters, type FilterOptions } from '@/components/Layout/SidebarFilters';
import { ProductGrid } from '@/components/Product/ProductGrid';
import { HomeStart } from '@/components/Layout/HomeStart';
import { emptyFilters, filterParams, parseFilters, type FilterState, type SortOption, type ProductGroup, type Branch } from '@/lib/catalog-filters';
interface Metadata {sourceDate:string|null;stale:boolean;products:number;stores:number;excludedPrices:number;storesAvailable:{id:string;label:string}[];departments:{id:string;label:string}[];branches:Branch[]}
interface Results {groups:ProductGroup[];total:number;offers:number;page:number;pageSize:number;totalPages:number;facets:Record<'types'|'categories'|'departments'|'stores'|'branches',Record<string,number>>;metadata:Metadata;online:{status:'idle'|'ready'|'error';timestamp?:string;count:number;total?:number;truncated:boolean}}
const defaultTypes=['Alimentos','Bebidas','Limpieza','Cuidado personal','Mascotas','Otros'];
export default function Home(){return <MainContent/>;}
function MainContent(){
  const [query,setQuery]=useState('');const [filters,setFilters]=useState<FilterState>({...emptyFilters});
  const [sort,setSort]=useState<SortOption>('relevance');const [page,setPage]=useState(1);const [size,setSize]=useState(12);
  const [ready,setReady]=useState(false);const [data,setData]=useState<Results|null>(null);const [metadata,setMetadata]=useState<Metadata|null>(null);
  const [catalogError,setCatalogError]=useState('');
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const [mobile,setMobile]=useState(false);
  const resultHeading=useRef<HTMLHeadingElement>(null);
  // Hydrate shareable filters after mount to avoid server/client markup differences.
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    // The URL is browser-owned state; read it once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try{setQuery((p.get('q')||'').slice(0,120));setFilters(parseFilters(p));const order=p.get('sort');if(['relevance','price-asc','price-desc','alpha-asc'].includes(order||''))setSort(order as SortOption);setPage(Math.max(1,Number(p.get('page'))||1));if([12,24,48].includes(Number(p.get('size'))))setSize(Number(p.get('size')));}catch{setError('No pudimos recuperar esos filtros. Elegilos nuevamente.');}
    setReady(true);
  },[]);
  useEffect(()=>{
    const c=new AbortController();fetch('/api/status',{signal:c.signal}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(next=>{setMetadata(next);setCatalogError('');}).catch(()=>{if(!c.signal.aborted)setCatalogError('No pudimos leer el catálogo. Volvé a intentar la búsqueda.');});
    return()=>c.abort();
  },[retry]);
  const rangeError=filters.maxPrice>0 && filters.minPrice>filters.maxPrice;
  useEffect(()=>{
    if(!ready)return;
    const params=filterParams(filters);if(query)params.set('q',query);if(sort!=='relevance')params.set('sort',sort);if(page>1)params.set('page',String(page));if(size!==12)params.set('size',String(size));
    window.history.replaceState(null,'',window.location.pathname+(params.size?'?'+params.toString():''));
    if(!query || rangeError)return;
    params.set('page',String(page));params.set('size',String(size));params.set('sort',sort);
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);setError('');
      try{const response=await fetch('/api/products?'+params,{signal:controller.signal});const next=await response.json();if(!response.ok)throw new Error(next.error || 'No pudimos consultar los precios.');if(!controller.signal.aborted){setData(next);setMetadata(next.metadata);}}
      catch(e){if(!controller.signal.aborted){setError(e instanceof Error?e.message:'No pudimos consultar los precios.');setData(null);}}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },180);
    return()=>{clearTimeout(timer);controller.abort();};
  },[query,filters,sort,page,size,retry,ready,rangeError]);
  const changeFilters=(next:FilterState)=>{if(next.maxPrice>0 && next.minPrice>next.maxPrice)setLoading(false);setFilters(next);setPage(1);};
  const search=(term:string)=>{setQuery(term);setPage(1);setRetry(n=>n+1);};
  const clear=()=>changeFilters({...emptyFilters});
  const stores=[ATOMO_RETAILER,...(metadata?.storesAvailable || []).filter(s=>s.id!=='atomo')];
  const branches=[...ATOMO_BRANCHES,...(metadata?.branches || []).filter(b=>!ATOMO_BRANCHES.some(a=>a.id===b.id))];
  const selectedBranch=branches.find(b=>b.id===filters.branch);
  const missingBranchPrices=selectedBranch?.priceStatus==='not-integrated';
  const departments=metadata?.departments || [];
  const facets=data?.facets;
  const options:FilterOptions={
    types:[...new Set([...defaultTypes,...Object.keys(facets?.types || {}),...filters.types])].map(id=>({id,label:id,count:facets?.types[id] || 0})),
    categories:[...new Set([...Object.keys(facets?.categories || {}),...filters.categories])].sort((a,b)=>a.localeCompare(b,'es')).map(id=>({id,label:id,count:facets?.categories[id] || 0})),
    departments:departments.map(d=>({...d,count:facets?.departments[d.id] || 0})),
    stores:stores.map(s=>({...s,count:facets?.stores[s.id] || 0})),branches:branches.map(b=>({...b,count:facets?.branches[b.id] || 0})),
  };
  const chips:{id:string;label:string;remove:()=>void}[]=[];
  for(const key of ['types','categories','stores'] as const)for(const value of filters[key])chips.push({id:key+value,label:key==='stores'?stores.find(s=>s.id===value)?.label || value:value,remove:()=>changeFilters({...filters,[key]:filters[key].filter(v=>v!==value),...(key==='types'?{categories:[]}:{}),...(key==='stores'?{branch:''}:{})})});
  if(filters.department)chips.push({id:'department',label:departments.find(d=>d.id===filters.department)?.label || filters.department,remove:()=>changeFilters({...filters,department:'',branch:''})});
  if(filters.branch)chips.push({id:'branch',label:branches.find(b=>b.id===filters.branch)?.label || filters.branch,remove:()=>changeFilters({...filters,branch:''})});
  if(filters.minPrice || filters.maxPrice)chips.push({id:'price',label:`Precio: ${filters.minPrice?`desde $${filters.minPrice.toLocaleString('es-AR')}`:''}${filters.minPrice && filters.maxPrice?' · ':''}${filters.maxPrice?`hasta $${filters.maxPrice.toLocaleString('es-AR')}`:''}`,remove:()=>changeFilters({...filters,minPrice:0,maxPrice:0})});
  return <div className="min-h-screen">
    <a href="#results" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-surface p-3 text-brand-ink">Saltar a resultados</a>
    <Header query={query} onSearch={search} onToggleSidebarMobile={()=>setMobile(true)} filterCount={chips.length}/>
    <div className="app-content">
      <SidebarFilters filters={filters} options={options} onChange={changeFilters} open={mobile} onClose={()=>setMobile(false)} count={data?.total || 0} loading={loading} hasQuery={!!query}/>
      <main id="results" className="min-w-0 flex-1" tabIndex={-1}>
        {metadata && <details className="catalog-status" data-testid="catalog-status"><summary className="min-h-11 py-2 cursor-pointer">SEPA {metadata.sourceDate?new Date(metadata.sourceDate+'T12:00:00Z').toLocaleDateString('es-AR'):''} · {metadata.stores} sucursales · Átomo online</summary><div className="space-y-2 py-3 max-w-prose"><p>{metadata.products.toLocaleString('es-AR')} precios de lista informados por los comercios. Pueden variar en caja. Átomo tiene sucursales físicas. Los precios integrados de Átomo corresponden por ahora a su tienda online, con envío o retiro en Guaymallén.</p><p>Fotos de Precios Claros, Vea y Átomo cuando están disponibles. Compará el contenido del envase.</p><p>{metadata.excludedPrices} importes menores de $100 apartados para revisión. Los filtros SEPA se aplican a todas las coincidencias antes de paginar.</p><p>Las categorías se asignan a partir del nombre del producto. Los departamentos se verifican con Georef; los casos contradictorios se indican por separado.</p></div></details>}
        {metadata?.stale && <p role="status" className="text-amber-800 mb-4">La base SEPA necesita actualizarse. Sus precios sirven como referencia histórica.</p>}
        <div className="catalog-heading"><div><h1 ref={resultHeading} tabIndex={-1} className="text-2xl font-bold leading-tight">{query?`Resultados para “${query}”`:'Compará antes de comprar'}</h1><p className="text-sm text-muted mt-2" role="status" aria-live="polite">{missingBranchPrices?'Precios de esta sucursal pendientes de integrar.':loading?'Buscando precios…':rangeError?'Corregí el rango de precios para continuar.':query && data?`${data.total.toLocaleString('es-AR')} productos · ${data.offers.toLocaleString('es-AR')} ofertas`:'Buscá un producto, elegí dónde comprar y compará sus precios.'}</p></div><button className="button-secondary catalog-filter-trigger" onClick={()=>setMobile(true)}><SlidersHorizontal size={18} aria-hidden="true"/>Filtros{chips.length>0?` (${chips.length})`:''}</button></div>
        {chips.length>0 && <div className="flex flex-wrap gap-2 mb-5" aria-label="Filtros activos">{chips.map(chip=><button key={chip.id} className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg border border-brand bg-brand-soft text-brand-ink text-sm text-left max-w-full" onClick={chip.remove} aria-label={`Quitar filtro ${chip.label}`}><span className="min-w-0 break-words">{chip.label}</span><X size={16} className="shrink-0" aria-hidden="true"/></button>)}<button onClick={clear} className="min-h-11 text-sm text-brand-ink underline px-2">Limpiar filtros</button></div>}
        {query && !missingBranchPrices && <div className="flex flex-wrap justify-end gap-3 mb-5"><label className="text-sm text-muted">Ordenar<select className="field mt-1 text-sm" value={sort} onChange={e=>{setSort(e.target.value as SortOption);setPage(1);}}><option value="relevance">Relevancia</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="alpha-asc">Nombre A–Z</option></select></label><label className="text-sm text-muted hidden sm:block">Por página<select className="field mt-1 text-sm" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);}}><option value={12}>12 productos</option><option value={24}>24 productos</option><option value={48}>48 productos</option></select></label></div>}
        {(error || catalogError) && <div role="alert" className="mb-5 text-red-800"><p>{error || catalogError}</p><button className="button-secondary mt-3" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={16} aria-hidden="true"/>Reintentar</button></div>}
        {!missingBranchPrices && !loading && data?.online.status==='error' && <p role="status" className="text-amber-800 text-sm mb-4">Átomo online no respondió. Se muestran los precios SEPA disponibles. <button className="underline min-h-11" onClick={()=>setRetry(n=>n+1)}>Reintentar Átomo</button></p>}
        {!missingBranchPrices && !loading && data?.online.truncated && <p className="text-sm text-muted mb-4">Átomo devolvió {data.online.count} de {data.online.total} coincidencias. Afiná la búsqueda para consultar otros productos online.</p>}
        {missingBranchPrices?<section className="py-8" aria-labelledby="branch-coverage-title"><h2 id="branch-coverage-title" className="text-xl font-bold">Átomo Corralitos · Sucursal física</h2><p className="text-muted mt-2">Severo del Castillo 5723, Los Corralitos, Guaymallén.</p><p className="mt-4 max-w-prose">Esta sucursal figura en el directorio oficial de Átomo. Todavía no incorporamos sus precios: esto no indica que no tenga productos o stock.</p><p className="mt-2 text-muted max-w-prose">Los precios de la tienda online se muestran por separado y no están confirmados para Corralitos.</p><div className="flex flex-wrap gap-3 mt-5"><a className="button-secondary" href={selectedBranch.sourceUrl || ATOMO_DIRECTORY_URL} target="_blank" rel="noopener noreferrer">Ver sucursal en el directorio oficial (PDF)</a><button className="button-secondary" onClick={()=>changeFilters({...filters,branch:'atomo-online',stores:['atomo']})}>Ver precios de la tienda online</button></div></section>:
          !query?<HomeStart onSearch={search}/>:
          rangeError?<div className="py-8"><p className="text-red-800">El precio máximo debe ser mayor o igual al mínimo.</p><button className="button-secondary mt-3" onClick={()=>changeFilters({...filters,minPrice:0,maxPrice:0})}>Quitar rango de precios</button></div>:
          !loading && !error && data?.total===0?<div className="py-10"><h2 className="text-lg font-semibold">{chips.length?'No hay productos con estos filtros':'No encontramos ese producto'}</h2><p className="text-muted mt-2">{chips.length?'Quitá algún filtro o limpiá la selección para ampliar la búsqueda.':'Probá con un nombre más corto, una marca o una presentación.'}</p>{chips.length>0 && <button className="button-secondary mt-4" onClick={clear}>Limpiar filtros</button>}</div>:
          <ProductGrid groups={data?.groups || []} isLoading={loading}/>}
        {query && !missingBranchPrices && !rangeError && !error && !loading && data && data.totalPages>1 && <nav className="flex flex-wrap items-center justify-between gap-3 mt-6" aria-label="Páginas de productos"><button className="button-secondary" disabled={data.page===1} onClick={()=>{setPage(data.page-1);resultHeading.current?.scrollIntoView({block:'start'});}}>Anterior</button><span className="text-sm text-muted">Página {data.page} de {data.totalPages}</span><button className="button-secondary" disabled={data.page===data.totalPages} onClick={()=>{setPage(data.page+1);resultHeading.current?.scrollIntoView({block:'start'});}}>Siguiente</button></nav>}
      </main>
    </div>
  </div>;
}
