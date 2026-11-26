import { Header } from '@/components/Layout/Header';
import { ReferenceExplorer } from '@/components/References/ReferenceExplorer';
import { getCatalogReferences } from '@/lib/reference-catalog-server';
import { isReferenceHistorical } from '@/lib/market-references';

export const dynamic='force-dynamic';
export const metadata={title:'Precios de referencia | MercadoInteligente',description:'Compará un precio de carnicería, verdulería o despensa con referencias de Cuyo y fuentes de Mendoza.'};

export default function ReferencesPage() {
  return <>
    <a href="#references" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-surface p-3 text-brand-ink">Saltar a precios de referencia</a>
    <Header active="references"/>
    <main id="references" className="reference-main" tabIndex={-1}>
      <div className="reference-intro"><h1 className="text-2xl sm:text-3xl font-bold leading-tight">¿Cómo está el precio que te cobran?</h1><p className="text-sm font-medium text-muted mt-3">Precios de referencia · Mendoza y Cuyo</p>
      <p className="text-muted mt-3 max-w-prose">Explorá precios de carnicería, verdulería y despensa. Compará tu compra con los supermercados de Mendoza o consultá los promedios oficiales de Cuyo.</p>
      </div><ReferenceExplorer {...getCatalogReferences()} historical={isReferenceHistorical()}/>
    </main>
  </>;
}
