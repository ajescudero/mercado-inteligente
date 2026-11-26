'use client';
import { useId, useState } from 'react';
import { ExternalLink, X, MapPin, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { unitPrice, type ProductGroup } from '@/lib/catalog-filters';
import type { Product } from '@/server/supermarkets/types';
import { ProductImage } from './ProductImage';
import { StoreLogo } from './StoreLogo';
import { Modal } from '../UI/Modal';
import { DesignIcon } from '../UI/DesignIcon';
export const money=(value:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2}).format(value);

function priceSource(p:Product){
  if(p.source==='ONLINE')return `Átomo online · ${p.sourceDate?'consultado '+new Date(p.sourceDate).toLocaleDateString('es-AR'):'fecha sin informar'}`;
  return `Precio de lista · ${p.priceDate?new Date(p.priceDate+'T12:00:00Z').toLocaleDateString('es-AR'):'fecha sin informar'}`;
}
function Offer({product:p,best=false,onAdd}:{product:Product;best?:boolean;onAdd:(p:Product)=>void}) {
  return <div className="offer-row">
    <div className="offer-store"><StoreLogo name={p.storeLabel || p.store} compact/><p><MapPin size={13} aria-hidden="true"/>{p.storeLocation}</p>{p.locationWarning && <p className="text-xs text-amber-800 mt-1">{p.locationWarning}</p>}</div>
    <div className="offer-price"><strong>{money(p.price)}</strong>{best && <span>Menor precio</span>}</div>
    <button className="add-circle" onClick={()=>onAdd(p)} aria-label={`Agregar ${p.name} en ${p.storeLabel}, ${p.storeLocation}`}><DesignIcon name="plus"/></button>
  </div>;
}
export function ProductCard({group}:{group:ProductGroup}) {
  const {addItem}=useCart();
  const p=group.product,unit=unitPrice(p),uid=useId();
  const [details,setDetails]=useState(false);
  const [showAll,setShowAll]=useState(false);
  const add=(product:Product)=>{setDetails(false);addItem(product);};
  const online=p.source==='ONLINE';
  return <>
    <article className="product-card" aria-label={p.name}>
      <div className="product-store-badge"><StoreLogo name={online ? "Átomo online" : p.storeLabel || p.store} compact badge logoOnly/></div>
      <button className="product-open" onClick={()=>setDetails(true)} aria-label={`Ver detalles y ofertas de ${p.name}`}>
        <span className="product-photo"><ProductImage src={p.image} name={p.name} ean={p.ean}/></span>
        <span className="product-category">{p.category || 'Supermercados'}</span>
        <h2>{p.name}</h2>
        <span className="product-presentation">{p.presentation || 'Consultá la presentación'}</span>
      </button>
      <div className="product-price-line"><div>{group.offerCount>1 && <span className="price-from">Desde</span>}<p className="product-price">{money(p.price)}</p></div><button className="add-circle" onClick={()=>add(p)} aria-label={`Agregar ${p.name}${online?' de Átomo online':''} a la lista`}><DesignIcon name="plus"/></button></div>
      {unit && <p className="product-unit">{money(unit.price)} / {unit.unit}</p>}
      <p className="product-store-name">{online?'Átomo · Tienda online':p.storeLabel || p.store}</p>
      <p className="product-source">{priceSource(p)}</p>
      {!online && <p className="product-location">{p.storeLocation}</p>}
      {p.locationWarning && <p className="product-location text-amber-800">{p.locationWarning}</p>}
      {online && <p className="product-location">Con envío o retiro. No confirmado para otras sucursales.</p>}
      <button className="product-offers" onClick={()=>setDetails(true)}>{online?'Ver oferta online':group.offerCount>1?`Comparar ${group.offerCount} sucursales`:'Ver oferta y sucursal'}<ChevronRight size={15} aria-hidden="true"/></button>
    </article>
    <Modal open={details} onClose={()=>setDetails(false)} titleId={uid+'title'}>
      <div className="dialog-header"><p className="dialog-kicker">Producto y ofertas</p><button className="icon-button" aria-label="Cerrar detalles del producto" onClick={()=>setDetails(false)}><X aria-hidden="true"/></button></div>
      <div className="dialog-body product-detail-body">
        <div className="detail-overview"><div className="detail-photo"><ProductImage src={p.image} name={p.name} ean={p.ean}/></div><div className="detail-description"><h2 id={uid+'title'}>{p.name}</h2><p className="text-sm text-muted mt-2">{p.category}</p>{p.presentation && <p className="text-muted mt-2">Contenido: {p.presentation}</p>}<p className="detail-price">{group.offerCount>1 && <span>Desde </span>}{money(p.price)}</p>{unit && <p className="text-sm text-muted mt-1">{money(unit.price)} / {unit.unit}</p>}<p className="text-xs text-muted mt-3">{priceSource(p)}</p></div></div>
        {online?<section className="online-offer"><h3>Oferta de la tienda online</h3><p>Precio con envío o retiro. No confirmado para otras sucursales de Átomo.</p>{p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="button-secondary mt-4">Ver en Átomo<ExternalLink size={16} aria-hidden="true"/><span className="sr-only"> (abre otra pestaña)</span></a>}</section>:<section className="detail-offers" aria-label="Ofertas por sucursal"><div className="section-heading"><h3>{group.offerCount>1?`Compará ${group.offerCount} sucursales`:'Dónde comprar'}</h3></div>{group.offers.slice(0,showAll?undefined:5).map((offer,i)=><Offer key={offer.id} product={offer} onAdd={add} best={group.offerCount>1 && i===0}/>)}{group.offerCount>5 && <button className="button-secondary w-full mt-4" onClick={()=>setShowAll(!showAll)}>{showAll?'Mostrar menos':`Ver las ${group.offerCount} sucursales`}</button>}</section>}
      </div>
      <div className="dialog-footer"><button className="button-primary w-full" onClick={()=>add(p)}><DesignIcon name="plus"/>Agregar esta oferta a mi lista · {money(p.price)}</button></div>
    </Modal>
  </>;
}
