'use client';
import { useState, useId } from 'react';
import { X, Search } from 'lucide-react';
import { StoreLogo } from '../Product/StoreLogo';
import { Modal } from '../UI/Modal';
import { ATOMO_DIRECTORY_URL } from '@/lib/atomo-locations';
import { emptyFilters, normalize, type FilterState, type Branch, type Facet } from '@/lib/catalog-filters';
export type { FilterState } from '@/lib/catalog-filters';
export interface CategoryInfo {name:string;count:number}
export interface FilterOptions {types:Facet[];categories:Facet[];departments:Facet[];stores:Facet[];branches:(Branch & {count?:number})[]}
interface Props { filters:FilterState;options:FilterOptions;onChange:(next:FilterState)=>void;open:boolean;onClose:()=>void;count:number;loading:boolean;hasQuery:boolean }
function FilterContent({filters:f,options:o,onChange,hasQuery}:{filters:FilterState;options:FilterOptions;onChange:Props['onChange'];hasQuery:boolean}) {
  const uid=useId();const [branchSearch,setBranchSearch]=useState('');
  const hasCounts=hasQuery && o.branches.find(b=>b.id===f.branch)?.priceStatus!=='not-integrated';
  const toggle=(key:'types'|'categories'|'stores',id:string)=>onChange({...f,[key]:f[key].includes(id)?f[key].filter(v=>v!==id):[...f[key],id],...(key==='types'?{categories:[]}:{}),...(key==='stores'?{branch:''}:{})});
  const choices=(items:Facet[],key:'types'|'categories'|'stores')=><div className="space-y-1">{items.map(item=><label key={item.id} className="filter-choice">
    <input type="checkbox" checked={f[key].includes(item.id)} onChange={()=>toggle(key,item.id)} disabled={hasCounts && !item.count && !f[key].includes(item.id) && !(key==='stores' && item.id==='atomo')}/>
    {key==='stores'?<StoreLogo name={item.label} compact/>:<span className="flex-1">{item.label}</span>}
    {hasCounts && <span className="ml-auto text-xs text-muted tabular-nums">{item.count}</span>}
  </label>)}</div>;
  const branches=o.branches.filter(b=>(!f.department || b.departmentId===f.department) && (!f.stores.length || f.stores.includes(b.bannerId)) && (!branchSearch || normalize(b.label+' '+b.department).includes(normalize(branchSearch))));
  const rangeError=f.maxPrice>0 && f.minPrice>f.maxPrice;
  return <div className="space-y-6">
    <section aria-labelledby={uid+'product'}>
      <h3 id={uid+'product'} className="filter-heading">Producto</h3>
      <fieldset><legend className="filter-label">Tipo de producto</legend>{choices(o.types,'types')}</fieldset>
      <details className="mt-3" open={!!f.types.length || !!f.categories.length || undefined}>
        <summary className="filter-summary">Categoría {f.categories.length>0 && `(${f.categories.length})`}</summary>
        {o.categories.length?choices(o.categories,'categories'):<p className="text-sm text-muted py-2">Buscá un producto para ver sus categorías.</p>}
      </details>
    </section>
    <section aria-labelledby={uid+'where'} className="border-t border-line pt-5">
      <h3 id={uid+'where'} className="filter-heading">Dónde comprar</h3>
      <label htmlFor={uid+'department'} className="filter-label">Departamento</label>
      <select id={uid+'department'} value={f.department} onChange={e=>onChange({...f,department:e.target.value,branch:''})} className="field">
        <option value="">Todos los departamentos</option>{o.departments.map(d=><option key={d.id} value={d.id}>{d.label}{hasCounts?` (${d.count})`:''}</option>)}
      </select>
      <details className="mt-3" open>
        <summary className="filter-summary">Supermercado {f.stores.length>0 && `(${f.stores.length})`}</summary>{choices(o.stores,'stores')}
        {f.stores.includes('atomo') && <p className="text-xs text-muted mt-2">Precios disponibles: tienda online. Las sucursales físicas están pendientes de integrar.</p>}
      </details>
      <details className="mt-3" open={!!f.branch || !!f.department || f.stores.includes('atomo') || undefined}>
        <summary className="filter-summary">Sucursal {f.branch && '(1)'}</summary>
        <label htmlFor={uid+'branch-search'} className="sr-only">Buscar sucursal por dirección</label>
        <div className="relative my-2"><Search size={16} className="absolute left-3 top-3.5 text-muted" aria-hidden="true"/><input id={uid+'branch-search'} value={branchSearch} onChange={e=>setBranchSearch(e.target.value)} placeholder="Buscar dirección…" className="field pl-9" type="search"/></div>
        <label className="filter-choice"><input type="radio" name={uid+'branch'} checked={!f.branch} onChange={()=>onChange({...f,branch:''})}/><span>Todas las sucursales</span></label>
        <div className="max-h-64 overflow-y-auto pr-1" role="group" aria-label="Sucursales disponibles">
          {branches.map(b=><label key={b.id} className="filter-choice items-start"><input type="radio" name={uid+'branch'} className="mt-1" checked={f.branch===b.id} onChange={()=>onChange({...f,branch:b.id})}/><span className="min-w-0"><span className="block">{b.label}</span><span className="block text-xs text-muted mt-1">{b.department}{b.priceStatus==='not-integrated'?' · Precios pendientes de integrar':hasCounts?` · ${b.count || 0} productos`:''}</span></span></label>)}
        </div>
        {(f.stores.includes('atomo') || f.branch.startsWith('atomo-')) && <a className="inline-flex min-h-11 items-center text-sm text-brand-ink underline" href={ATOMO_DIRECTORY_URL} target="_blank" rel="noopener noreferrer">Ver todas las sucursales de Átomo (PDF)</a>}
        {!branches.length && <p className="text-sm text-muted py-2">No hay sucursales con esa dirección. Probá otra calle.</p>}
      </details>
    </section>
    <fieldset className="border-t border-line pt-5"><legend className="filter-heading pt-5">Precio por envase</legend>
      <div className="grid grid-cols-2 gap-3">{(['minPrice','maxPrice'] as const).map((key,i)=><div key={key}><label htmlFor={uid+key} className="filter-label">{i?'Hasta ($)':'Desde ($)'}</label><input id={uid+key} type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" value={f[key] || ''} onChange={e=>onChange({...f,[key]:Math.max(0,Number(e.target.value) || 0)})} placeholder={i?'Sin máximo':'0'} className="field" aria-invalid={rangeError} aria-describedby={rangeError?uid+'range-error':undefined}/></div>)}</div>
      {rangeError && <p id={uid+'range-error'} role="alert" className="text-sm text-red-700 mt-2">El máximo debe ser mayor o igual al mínimo. <button className="underline" onClick={()=>onChange({...f,minPrice:0,maxPrice:0})}>Quitar rango</button></p>}
    </fieldset>
  </div>;
}
export function SidebarFilters(p:Props) {
  const content=<FilterContent filters={p.filters} options={p.options} onChange={p.onChange} hasQuery={p.hasQuery}/>;
  return <>
    <aside className="catalog-sidebar" aria-label="Filtros de productos">
      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Filtros</h2><button className="text-sm text-brand-ink underline min-h-11" onClick={()=>p.onChange({...emptyFilters})}>Limpiar</button></div>{content}
    </aside>
    <Modal open={p.open} onClose={p.onClose} side="left" titleId="mobile-filters-title">
      <div className="dialog-header"><h2 id="mobile-filters-title" className="text-xl font-bold">Filtros</h2><button className="icon-button" aria-label="Cerrar filtros" onClick={p.onClose}><X aria-hidden="true"/></button></div>
      <div className="dialog-body"><FilterContent filters={p.filters} options={p.options} onChange={p.onChange} hasQuery={p.hasQuery}/></div>
      <div className="dialog-footer flex gap-3"><button className="button-secondary" onClick={()=>p.onChange({...emptyFilters})}>Limpiar</button><button className="button-primary flex-1" onClick={p.onClose}>{p.options.branches.find(b=>b.id===p.filters.branch)?.priceStatus==='not-integrated'?'Ver sucursal':p.loading || !p.hasQuery?'Ver resultados':`Ver ${p.count} productos`}</button></div>
    </Modal>
  </>;
}
