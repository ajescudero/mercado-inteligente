'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

export function ProductImage({ src, name, ean }: { src?: string; name: string; ean?: string }) {
  const [failed, setFailed] = useState<string>();
  const [replacement, setReplacement] = useState<{ original: string; url: string }>();
  const activeSrc = replacement && replacement.original === src ? replacement.url : src;
  const handleError = () => {
    setFailed(activeSrc);
    if (activeSrc === src && src && ean && /^\d{8,14}$/.test(ean)) {
      fetch(`/api/product-image?ean=${encodeURIComponent(ean)}`)
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (data?.image) setReplacement({ original: src, url: data.image }); })
        .catch(() => {});
    }
  };
  if (!activeSrc || failed === activeSrc) return (
    <div className="text-muted flex flex-col items-center text-center" aria-label={`Foto no disponible: ${name}`}>
      <Package size={32} aria-hidden="true" />
      <span className="text-xs mt-2">Foto no disponible</span>
    </div>
  );
  // The source has no image for some GTINs; do not substitute another product.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={activeSrc} alt={name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={handleError} className="max-h-full max-w-full object-contain" />;
}
