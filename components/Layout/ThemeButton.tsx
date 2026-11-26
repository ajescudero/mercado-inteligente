'use client';
import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeButton() {
  useEffect(()=>{
    try {
      const saved=localStorage.getItem('mercado-theme');
      document.documentElement.dataset.theme=saved==='dark'||saved==='light'?saved:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    } catch { /* The light theme stays usable when storage is unavailable. */ }
  },[]);
  const toggle=()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    try {localStorage.setItem('mercado-theme',next);} catch { /* Theme still applies for this session. */ }
  };
  return <button className="icon-button theme-toggle" type="button" onClick={toggle} aria-label="Cambiar entre tema claro y oscuro"><Moon className="theme-moon" size={19} aria-hidden="true"/><Sun className="theme-sun" size={19} aria-hidden="true"/></button>;
}
