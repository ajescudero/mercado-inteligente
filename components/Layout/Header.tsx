'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SlidersHorizontal, ShoppingBag, MapPin } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { DesignIcon } from '../UI/DesignIcon';
import { ThemeButton } from './ThemeButton';
import { SectionNav } from './SectionNav';

interface HeaderProps {
  onSearch?:(query:string)=>void;
  onToggleSidebarMobile?:()=>void;
  query?:string;
  filterCount?:number;
  active?:'catalog'|'references';
}
export function Header({onSearch,onToggleSidebarMobile,query:activeQuery='',filterCount=0,active='catalog'}:HeaderProps) {
  const [query,setQuery]=useState(activeQuery);
  const {totalItems,setIsOpen}=useCart();
  useEffect(()=>{setQuery(activeQuery);},[activeQuery]); // eslint-disable-line react-hooks/set-state-in-effect
  return <>
    <header className="app-header">
      <div className="header-inner">
        <Link href="/" onNavigate={event=>{if(active==='catalog'){event.preventDefault();window.location.assign('/');}}} className="brand" aria-label="MercadoInteligente, inicio">
          <span className="brand-mark"><ShoppingBag size={25} aria-hidden="true"/></span>
          <span><span className="brand-caption">Tu compra, bien pensada</span><span className="brand-name">MercadoInteligente</span></span>
        </Link>
        <div className="header-location"><MapPin size={16} aria-hidden="true"/>Mendoza</div>
        <ThemeButton/>
        <button className="header-list" aria-label={`Abrir mi lista${totalItems?`, ${totalItems} unidades`:''}`} onClick={()=>setIsOpen(true)}>
          <span className="basket-icon"><DesignIcon name="basket"/></span><span>Mi lista</span>
          {totalItems>0 && <span className="list-count">{totalItems}</span>}
        </button>
        <form className="search-form" action="/" method="get" role="search" onSubmit={e=>{
          if(onSearch){e.preventDefault();if(query.trim().length>=2)onSearch(query.trim());}
        }}>
          <label htmlFor="product-search" className="sr-only">Buscar productos</label>
          <span className="search-symbol"><DesignIcon name="search"/></span>
          <input id="product-search" name="q" type="search" required minLength={2} maxLength={120} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscá leche, arroz, limpiador…"/>
          <button type="submit" className="search-submit">Buscar</button>
        </form>
        {onToggleSidebarMobile && <button className="icon-button mobile-filter-button" aria-label={`Abrir filtros${filterCount?`, ${filterCount} activos`:''}`} onClick={onToggleSidebarMobile}><SlidersHorizontal size={20} aria-hidden="true"/>{filterCount>0 && <span className="count-dot">{filterCount}</span>}</button>}
      </div>
    </header>
    <SectionNav active={active}/>
  </>;
}
