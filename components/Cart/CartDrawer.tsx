'use client';
import { useRef, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { X, Trash2, Minus, Plus, TrendingDown } from 'lucide-react';
import { storeTitle } from '@/lib/cart-optimization';
import { OptimizationModal } from './OptimizationModal';
import { ProductImage } from '../Product/ProductImage';
import { Modal } from '../UI/Modal';
import { money } from '../Product/ProductCard';
import { catalogCartItems, isOnlineProduct } from '@/lib/cart-products';
export function CartDrawer(){
  const {items,removeItem,updateQuantity,totalPrice,isOpen,setIsOpen,clearCart}=useCart();
  const comparableItems=catalogCartItems(items);const hasOnline=items.some(isOnlineProduct);
  const [optimize,setOptimize]=useState(false);const [confirm,setConfirm]=useState(false);
  const closeButton=useRef<HTMLButtonElement>(null);
  const focusAfterRemoval=()=>closeButton.current?.focus();
  const close=()=>{setIsOpen(false);setConfirm(false);setOptimize(false);};
  return <><Modal open={isOpen} onClose={close} titleId="cart-title" side="right">
    <div className="dialog-header"><h2 id="cart-title" className="text-xl font-bold">Mi lista {items.length>0 && <span className="text-sm font-normal text-muted">({items.length})</span>}</h2><button ref={closeButton} className="icon-button" onClick={close} aria-label="Cerrar mi lista"><X aria-hidden="true"/></button></div>
    <div className="dialog-body">
      {!items.length?<div className="py-8"><h3 className="text-lg font-semibold">Tu lista está vacía</h3><p className="text-muted mt-2">Elegí una oferta de los resultados para empezar tu lista.</p><button className="button-secondary mt-5" onClick={close}>Volver a los productos</button></div>:
        <div className="divide-y divide-line">{items.map(item=><div key={item.id+'-'+item.store} className="cart-item">
          <div className="flex gap-3"><div className="cart-item-photo"><ProductImage src={item.image} name={item.name} ean={item.ean}/></div><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm">{item.name}</h3><p className="text-sm text-muted mt-1">{item.presentation}</p><p className="text-xs text-muted mt-1">{storeTitle(item)}</p>{isOnlineProduct(item)?<p className="text-xs text-muted mt-2">Precio online {item.sourceDate?`consultado el ${new Date(item.sourceDate).toLocaleDateString('es-AR')}`:'sin fecha de consulta'}. No se actualiza al abrir la lista.{item.url && <> <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-brand-ink underline">Revisar en Átomo<span className="sr-only"> (abre otra pestaña)</span></a></>}</p>:item.unavailable && <p className="text-sm text-amber-800 mt-2">No figura en el catálogo actual. Volvé a buscarlo antes de comparar.</p>}</div></div>
          <div className="flex flex-wrap justify-between items-center gap-2 mt-3"><span className="font-bold tabular-nums">{money(item.price*item.quantity)}</span><div className="quantity-controls"><button className="icon-button border border-line" aria-label={`Quitar una unidad de ${item.name}`} onClick={()=>{if(item.quantity===1)focusAfterRemoval();updateQuantity(item.id,item.store,item.quantity-1);}}><Minus size={16} aria-hidden="true"/></button><span className="w-8 text-center tabular-nums" aria-label={`${item.quantity} unidades`}>{item.quantity}</span><button className="icon-button quantity-plus" disabled={item.quantity>=999} aria-label={`Agregar una unidad de ${item.name}`} onClick={()=>updateQuantity(item.id,item.store,item.quantity+1)}><Plus size={16} aria-hidden="true"/></button><button className="icon-button" aria-label={`Quitar ${item.name} de la lista`} onClick={()=>{focusAfterRemoval();removeItem(item.id,item.store);}}><Trash2 size={18} aria-hidden="true"/></button></div></div>
        </div>)}</div>}
      {items.length>0 && <div className="pt-4 border-t border-line">{confirm?<div><p className="text-sm">¿Quitar los {items.length} productos de la lista?</p><div className="flex gap-3 mt-3"><button className="button-secondary" onClick={()=>{focusAfterRemoval();setConfirm(false);}}>Conservar lista</button><button className="button-secondary text-red-700" onClick={()=>{focusAfterRemoval();clearCart();setConfirm(false);}}>Vaciar lista</button></div></div>:<button className="text-sm text-muted underline min-h-11" onClick={()=>{focusAfterRemoval();setConfirm(true);}}>Vaciar lista</button>}</div>}
    </div>
    {items.length>0 && <div className="dialog-footer"><div className="flex justify-between items-center gap-3 mb-3"><span className="font-semibold">Total estimado</span><span className="cart-total text-2xl font-bold tabular-nums">{money(totalPrice)}</span></div><button className="button-primary w-full" disabled={!comparableItems.length || comparableItems.some(i=>i.unavailable)} onClick={()=>setOptimize(true)}><TrendingDown size={18} aria-hidden="true"/>{hasOnline?'Comparar productos SEPA':'Comparar mi lista'}</button><p className="text-xs text-muted mt-3">{hasOnline?'Átomo online se incluye en el total y se conserva en tu lista. La comparación entre sucursales usa sólo los productos SEPA.':'Comparamos los mismos productos entre sucursales SEPA.'} Este total sólo suma productos. Al comparar podés estimar traslados y envíos.</p></div>}
  </Modal><OptimizationModal isOpen={optimize} onClose={()=>setOptimize(false)}/></>;
}
