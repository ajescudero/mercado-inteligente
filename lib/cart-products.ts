import type { Product } from '../server/supermarkets/types';
import { cartKey } from './cart-optimization';

export interface ShoppingCartItem extends Product { quantity: number }

export const isOnlineProduct = (product: Product) => product.source === 'ONLINE' || product.store === 'atomo-online';

// The local catalog only knows SEPA offers. An online offer absent from it is
// unverified by that catalog, not unavailable at its own source.
export function catalogCartItems<T extends Product>(items: T[]): T[] {
  return items.filter(item => !isOnlineProduct(item));
}

export function refreshCatalogCart(items: ShoppingCartItem[], rows: { id: string; product: Product | null }[]): ShoppingCartItem[] {
  const fresh = new Map(rows.map(row => [row.id, row.product]));
  return items.map(item => {
    if (isOnlineProduct(item) || !fresh.has(item.id)) return item;
    const product = fresh.get(item.id);
    return product ? { ...product, quantity: item.quantity } : { ...item, unavailable: true };
  });
}

// A SEPA comparison replaces only its selected offers, keeping the rest of the
// shopping list (including Átomo snapshots and quantities) intact.
export function applyCatalogComparison(items: ShoppingCartItem[], mapping: Record<string, Product>): ShoppingCartItem[] {
  return items.map(item => {
    const replacement = mapping[cartKey(item)];
    return !isOnlineProduct(item) && replacement ? { ...replacement, quantity: item.quantity } : item;
  });
}
