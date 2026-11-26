import locations from '../data/branch-locations.json';

type Location = { lat: number; lng: number; address: string; departmentId: string | null; department: string | null; warning: string | null };
const references = locations as Record<string, Location>;
export function storeLocation(store: { id: string; address: string; lat?: number; lng?: number }) {
  const known = references[store.id];
  // A changed address or coordinate must not inherit an obsolete department.
  if (known && known.address.trim() === store.address.trim() && known.lat === store.lat && known.lng === store.lng) {
    return { departmentId: known.departmentId || 'unknown', department: known.department === 'Capital' ? 'Ciudad de Mendoza (Capital)' : known.department || 'Ubicación por verificar', locationWarning: known.warning || undefined };
  }
  return { departmentId: 'unknown', department: 'Ubicación por verificar', locationWarning: 'Departamento pendiente de verificación.' };
}

export function supermarket(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('carrefour')) return { id: 'carrefour', label: 'Carrefour' };
  if (lower.includes('chango')) return { id: 'changomas', label: 'ChangoMás' };
  if (lower.includes('coto')) return { id: 'coto', label: 'Coto' };
  if (lower.includes('jumbo')) return { id: 'jumbo', label: 'Jumbo' };
  if (lower.includes('vea')) return { id: 'vea', label: 'Vea' };
  if (lower.includes('simplicity')) return { id: 'simplicity', label: 'Simplicity' };
  return { id: name, label: name };
}
