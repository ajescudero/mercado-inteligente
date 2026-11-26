import type { Branch } from './catalog-filters';

export const ATOMO_RETAILER = { id: 'atomo', label: 'Átomo' };
export const ATOMO_DIRECTORY_URL = 'https://atomoconviene.com/atomo-ecommerce/img/cms/horarios-sucursales.pdf';
export const ATOMO_ONLINE_BRANCH: Branch = {
  id: 'atomo-online', bannerId: 'atomo', label: 'Átomo · Tienda online (envío o retiro)',
  address: 'Retiro: Juan M. Estrada 1136', departmentId: '50028', department: 'Guaymallén',
  kind: 'online', priceStatus: 'available',
};
// Official directory, page 2, checked on 2026-11-15. This is a directory id,
// not a SEPA identifier. No online price is copied to this physical branch.
export const ATOMO_PHYSICAL_BRANCHES: Branch[] = [{
  id: 'atomo-corralitos', bannerId: 'atomo', label: 'Átomo Corralitos · Severo del Castillo 5723',
  address: 'Severo del Castillo 5723, Los Corralitos', departmentId: '50028', department: 'Guaymallén',
  kind: 'physical', priceStatus: 'not-integrated', sourceUrl: ATOMO_DIRECTORY_URL,
}];
export const ATOMO_BRANCHES = [...ATOMO_PHYSICAL_BRANCHES, ATOMO_ONLINE_BRANCH];

export function withAtomoLocations<T extends { branches: Branch[]; storesAvailable: {id:string;label:string}[] }>(metadata: T) {
  return {
    ...metadata,
    branches: [...metadata.branches.filter(b => !ATOMO_BRANCHES.some(a => a.id === b.id)), ...ATOMO_BRANCHES],
    storesAvailable: [ATOMO_RETAILER, ...metadata.storesAvailable.filter(s => s.id !== ATOMO_RETAILER.id)],
  };
}
