'use client';
import Link from 'next/link';
import { ArrowRight, ListChecks, Search, Store } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { DesignIcon } from '../UI/DesignIcon';

const categories=[
  {label:'Manzana',term:'Manzana',icon:'apple'},
  {label:'Papa',term:'Papa',icon:'broccoli'},
  {label:'Leche',term:'Leche',icon:'cheese'},
  {label:'Carne',term:'Carne',icon:'meat'},
] as const;
export function HomeStart({onSearch}:{onSearch:(term:string)=>void}) {
  const {setIsOpen,totalItems}=useCart();
  return <div className="home-start">
    <section className="shopping-banner" aria-labelledby="shopping-banner-title">
      <div><h2 id="shopping-banner-title">Tu lista.<br/>Una mejor compra.</h2><p>Buscá lo que necesitás y compará el mismo producto entre sucursales.</p><button className="banner-button" onClick={()=>document.getElementById('product-search')?.focus()}>Empezar a buscar<ArrowRight size={17} aria-hidden="true"/></button></div>
      <div className="banner-list"><span className="basket-icon"><DesignIcon name="basket"/></span><h3>Todo en tu lista</h3><p>{totalItems?`${totalItems} unidades guardadas para tu próxima compra.`:'Guardá tus productos y compará la canasta completa.'}</p><button onClick={()=>setIsOpen(true)}>Abrir mi lista<ArrowRight size={16} aria-hidden="true"/></button></div>
    </section>
    <section aria-labelledby="food-categories-title" className="home-categories">
      <div className="section-heading"><h2 id="food-categories-title">Buscá por alimento</h2><span>Elegí por dónde empezar</span></div>
      <div className="category-row">{categories.map(item=><button key={item.term} onClick={()=>onSearch(item.term)} className="category-link"><span className={`category-art ${item.icon==='apple'?'category-apple':''}`}><DesignIcon name={item.icon}/></span><span>{item.label}</span></button>)}</div>
    </section>
    <section className="quick-searches" aria-labelledby="quick-search-title"><h2 id="quick-search-title">Algo de tu compra de siempre</h2><div>{['Leche','Arroz','Desodorante de piso'].map(term=><button key={term} className="button-secondary" onClick={()=>onSearch(term)}><Search size={16} aria-hidden="true"/>{term}<ArrowRight size={16} aria-hidden="true"/></button>)}</div></section>
    <div className="home-help"><div><ListChecks size={23} aria-hidden="true"/><h3>Elegí una oferta</h3><p>Revisá presentación, precio y sucursal antes de agregarla a tu lista.</p></div><div><Store size={23} aria-hidden="true"/><h3>Compará dónde comprar</h3><p>Conservá las cantidades y compará tu canasta entre sucursales SEPA.</p></div><Link href="/referencias"><BookIcon/><h3>Consultá una referencia</h3><p>Contrastá el importe de tu compra con los promedios de Cuyo.</p><span>Ver referencias <ArrowRight size={15} aria-hidden="true"/></span></Link></div>
  </div>;
}
function BookIcon(){return <span className="reference-symbol" aria-hidden="true">$</span>;}
