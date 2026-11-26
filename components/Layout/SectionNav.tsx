'use client';
import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { DesignIcon } from '../UI/DesignIcon';

export function SectionNav({active}:{active:'catalog'|'references'}) {
  const {totalItems,setIsOpen,isOpen}=useCart();
  return <nav aria-label="Secciones de MercadoInteligente" className="section-nav">
    <div className="section-nav-inner">
      <Link href="/" onNavigate={event=>{if(active==='catalog'){event.preventDefault();window.location.assign('/');}}} aria-current={active==='catalog'?'page':undefined} className="nav-item"><DesignIcon name="home"/><span><span className="nav-desktop-label">Supermercados</span><span className="nav-mobile-label">Inicio</span></span></Link>
      <a href="#product-search" className="nav-item nav-search" onClick={e=>{e.preventDefault();document.getElementById('product-search')?.focus();}}><Search size={21} aria-hidden="true"/><span>Buscar</span></a>
      <button className="nav-item nav-cart" aria-label={`Abrir mi lista${totalItems?`, ${totalItems} unidades`:''}`} aria-pressed={isOpen} onClick={()=>setIsOpen(true)}><span className="nav-cart-circle"><DesignIcon name="basket"/>{totalItems>0 && <span className="count-dot">{totalItems}</span>}</span><span>Mi lista</span></button>
      <Link href="/referencias" aria-current={active==='references'?'page':undefined} className="nav-item"><BookOpen size={21} aria-hidden="true"/><span><span className="nav-desktop-label">Precios de referencia</span><span className="nav-mobile-label">Referencias</span></span></Link>
    </div>
  </nav>;
}
