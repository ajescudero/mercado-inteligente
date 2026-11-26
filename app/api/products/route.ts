import { atomoSearchTerm } from '@/lib/search-vocabulary';
import { withAtomoLocations } from '@/lib/atomo-locations';
import { NextRequest, NextResponse } from 'next/server';
import { getCatalogMetadata, searchCatalogAll, filterCatalogMatches } from '@/lib/catalog';
import { buildFacets, groupProducts, matchesFilters, parseFilters, type SortOption } from '@/lib/catalog-filters';
import { searchAtomo } from '@/server/supermarkets/atomo';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const params=request.nextUrl.searchParams;
  const query=(params.get('q') || '').trim();
  if (query.length>120) return NextResponse.json({error:'La búsqueda debe tener hasta 120 caracteres.'},{status:400});
  let filters;
  try {filters=parseFilters(params);} catch(e) {return NextResponse.json({error:(e as Error).message},{status:400});}
  const sort=params.get('sort') || 'relevance';
  if (!['relevance','price-asc','price-desc','alpha-asc','unit-asc'].includes(sort)) return NextResponse.json({error:'Elegí un orden válido.'},{status:400});
  const pageSize=Number(params.get('size') || 12);const requestedPage=Number(params.get('page') || 1);
  if (![12,24,48].includes(pageSize) || !Number.isSafeInteger(requestedPage) || requestedPage<1) return NextResponse.json({error:'Página inválida.'},{status:400});
  try {
    const metadata=withAtomoLocations(getCatalogMetadata());
    const priceCoverage=metadata.branches.find(b=>b.id===filters.branch)?.priceStatus;
    const pendingOnline=query.length>=2 && priceCoverage!=='not-integrated' ? searchAtomo(atomoSearchTerm(query)) : undefined;
    const local=searchCatalogAll(query);
    const online=await pendingOnline;
    const all=[...local,...filterCatalogMatches(online?.products || [],query)];
    const matched=all.filter(p=>matchesFilters(p,filters));
    const groups=groupProducts(matched,query,sort as SortOption);
    const totalPages=Math.max(1,Math.ceil(groups.length/pageSize));
    const page=Math.min(requestedPage,totalPages);
    const pageGroups=groups.slice((page-1)*pageSize,page*pageSize);
    return NextResponse.json({groups:pageGroups, total:groups.length, offers:groups.reduce((sum,g)=>sum+g.offerCount,0), page,pageSize,totalPages,
      facets:buildFacets(all,filters), metadata, priceCoverage:priceCoverage || 'available',
      online:{status:!online?'idle':online.error?'error':'ready',timestamp:online?.timestamp,total:online?.total,count:online?.products.length || 0,truncated:online?.truncated || false},
    });
  } catch {return NextResponse.json({error:'No pudimos consultar los precios. Intentá nuevamente.'},{status:503});}
}
