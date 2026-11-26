import { ProductCard } from './ProductCard';
import type { ProductGroup } from '@/lib/catalog-filters';
export function ProductGrid({groups,isLoading=false}:{groups:ProductGroup[];isLoading?:boolean}) {
  return <div className="product-grid" aria-busy={isLoading}>
    {isLoading?Array.from({length:6},(_,i)=><div key={i} aria-hidden="true" className="product-skeleton"><div/><span/><span/><span/></div>):groups.map(group=><ProductCard key={group.id} group={group}/>)}
  </div>;
}
