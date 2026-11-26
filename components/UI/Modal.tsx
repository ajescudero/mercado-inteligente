'use client';
import { useEffect, useRef, type ReactNode } from 'react';
let locks = 0; let originalOverflow = '';
export function Modal({open,onClose,titleId,children,side='center'}:{open:boolean;onClose:()=>void;titleId:string;children:ReactNode;side?:'left'|'right'|'center'}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current;if(!open || !dialog)return;
    const previous=document.activeElement as HTMLElement | null;
    if(!locks++) {originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    dialog.showModal();
    return ()=>{dialog.close();if(!--locks)document.body.style.overflow=originalOverflow;if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[open]);
  return <dialog ref={ref} tabIndex={-1} aria-labelledby={titleId} className="ui-dialog" data-side={side}
    onKeyDown={event=>{
      if(event.key!=='Tab')return;
      const dialog=event.currentTarget;
      const focusable=[...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(element=>element.getClientRects().length && getComputedStyle(element).visibility!=='hidden');
      const first=focusable[0],last=focusable[focusable.length-1];
      if(!first){event.preventDefault();dialog.focus();return;}
      if(event.shiftKey && (document.activeElement===first || document.activeElement===dialog)){event.preventDefault();last.focus();}
      else if(!event.shiftKey && (document.activeElement===last || document.activeElement===dialog)){event.preventDefault();first.focus();}
    }}
    onCancel={event=>{event.preventDefault();onClose();}}
    onClick={event=>{const rect=event.currentTarget.getBoundingClientRect();if(event.target===event.currentTarget && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom))onClose();}}>
    {open && children}
  </dialog>;
}
