/** Reviewed vocabulary, shared by catalog and reference searches.
 * Aliases broaden discovery only: they never merge SKUs or replace quality/size.
 */
export const SEARCH_VOCABULARY = [
  { id: 'carne-molida', aliases: ['molida', 'picada'], context: 'meat',
    regionalNames: { Mendoza: 'carne molida', 'Buenos Aires': 'carne picada' },
    evidence: 'Vocabulario confirmado por Aldo; descripciones SEPA y Átomo.' },
  { id: 'morron', aliases: ['morron', 'pimiento'], context: 'produce',
    evidence: 'SENASA, Resolución 809/2025, anexo 3.1: pimiento también llamado morrón.' },
  { id: 'yogur', aliases: ['yogur', 'yogurt'], context: 'general',
    evidence: 'Correspondencia existente del proyecto y denominaciones del catálogo.' },
  { id: 'limpiador-pisos', aliases: ['desodorante', 'limpiador', 'limpia'], context: 'floor',
    evidence: 'Regla de intención existente del proyecto, sólo junto a piso/pisos.' },
] as const;

export const normalizeSearch = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
export const searchTerms = (query: string) => normalizeSearch(query).split(' ').filter(term => term && !['de','del','para','el','la','los','las'].includes(term)).slice(0, 10);
const meat = SEARCH_VOCABULARY[0];
const pepper = SEARCH_VOCABULARY[1];
export function vocabularyIntent(query: string) {
  const terms = searchTerms(query);
  const meatWord = terms.find(term => (meat.aliases as readonly string[]).includes(term));
  const groundMeat = !!meatWord && (terms.includes('carne') || terms[0] === meatWord) &&
    !terms.some(term => /^(fiambres?|salames?|pimienta|nuez|almendra|galleta|soja)$/.test(term));
  const freshPepper = pepper.aliases.some(alias => terms.includes(alias)) &&
    !terms.some(term => /^(conserva|lata|polvo|molido|pimenton|picante)$/.test(term));
  const floorCleaner = terms.some(term => /^pisos?$/.test(term)) && terms.some(term => /^(desodorantes?|limpiadores?|limpiador|limpia)$/.test(term));
  const kept = groundMeat ? terms.filter(term => term !== 'carne') : terms;
  const groups = kept.map(term => groundMeat && (meat.aliases as readonly string[]).includes(term) ? [...meat.aliases] :
    freshPepper && (pepper.aliases as readonly string[]).includes(term) ? [...pepper.aliases] :
    ['yogur','yogurt'].includes(term) ? ['yogur','yogurt'] : [term]);
  return { terms, groups, groundMeat, freshPepper, floorCleaner };
}
export function isGroundMeatName(name: string) {
  const text = normalizeSearch(name);
  return /\b(molida|picada)\b/.test(text) && /^(picada|molida)\b|\bcarne\b/.test(text) &&
    !/\b(fiambres?|salames?|pimienta|alimento|alim|perro|gato|caldo|sopa|relleno|empanada|raviol|soja)\b/.test(text);
}
/** Client-side reference filtering follows the same reviewed aliases. */
export function matchesVocabulary(name: string, query: string) {
  const text = normalizeSearch(name), intent = vocabularyIntent(query);
  if (!intent.terms.length) return true;
  if (intent.groundMeat && !isGroundMeatName(name)) return false;
  if (intent.freshPepper && /\b(conserva|lata|polvo|molido|pimenton|picante)\b/.test(text)) return false;
  return intent.groups.every(group => group.some(term => text.includes(term)));
}
/** Use the retailer's local wording in its existing single request. */
export function atomoSearchTerm(query: string) {
  const intent = vocabularyIntent(query);
  if (!intent.groundMeat) return query;
  return intent.groups.map(group => group.includes('molida') ? 'molida' : group[0]).join(' ');
}
