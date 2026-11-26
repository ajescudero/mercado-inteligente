'use client';
import { useState } from 'react';
import Image from 'next/image';

export function StoreLogo({ name, compact = false, badge = false, logoOnly = false }: { name: string; compact?: boolean; badge?: boolean; logoOnly?: boolean }) {
  const label = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const candidate = label.includes('carrefour') ? 'carrefour.jpg' : label.includes('chango') ? 'changomas.jpg'
    : label.includes('coto') ? 'coto.ico' : label.includes('jumbo') ? 'jumbo.svg'
      : label.includes('vea') ? 'vea.png' : label.includes('simplicity') ? 'simplicity.svg' : label.includes('atomo') ? 'atomo.png' : null;
  const logo = candidate === failedLogo ? null : candidate;
  return <span className={badge ? "store-badge" : "inline-flex items-center gap-2 min-w-0"} title={name}>
    {logo && <span className={`relative shrink-0 overflow-hidden bg-white rounded ${compact ? 'h-6 w-10' : 'h-8 w-12'}`}>
      <Image src={`/stores/${logo}`} alt={badge ? `Logo de ${name}` : ""} width={128} height={128} unoptimized onError={() => setFailedLogo(logo)}
        className={label.includes('chango') ? `absolute max-w-none ${compact ? 'h-20 w-20' : 'h-24 w-24'} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` : 'h-full w-full object-contain'} />
    </span>}
    <span className={logoOnly && logo ? "sr-only" : badge ? "store-badge-label" : "text-sm text-ink leading-snug"}>{name}</span>
  </span>;
}
