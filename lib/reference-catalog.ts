import type { MarketReference, ReferenceCategory, ReferenceUnit } from './market-references';
import { normalizeSearch, isGroundMeatName } from './search-vocabulary';

// Only actual catalog descriptions enter the list. These are inclusion rules,
// not a price list and not a mapping that makes different cuts equivalent.
export const REFERENCE_PREFIXES = {
  Carnicería: ['ASADO','VACIO','VACÍO','NALGA','CUADRIL','PECETO','PALETA','BIFE','BOLA DE LOMO','COLITA','LOMO','OSOBUCO','MATAMBRE','ENTRAÑA','ENTRANA','COSTILLA','COSTELETA','CHULETA','CARNE','PICADA','MOLIDA','POLLO','PECHUGA','PATA MUSLO','SUPREMA','ALITA','CERDO','BONDIOLA','CHORIZO','MORCILLA','HIGADO','RIÑON','RINON','LENGUA','MERLUZA','SALMON'],
  Verdulería: ['PAPA','BATATA','TOMATE','ZANAHORIA','CEBOLLA','ZAPALLO','ZAPALLITO','CALABAZA','MORRON','MORRÓN','PIMIENTO','LECHUGA','ACELGA','ESPINACA','BERENJENA','PEPINO','REMOLACHA','REPOLLO','BROCOLI','BRÓCOLI','COLIFLOR','AJO','APIO','CHOCLO','CHAUCHA','MANZANA','PERA','BANANA','NARANJA','MANDARINA','LIMON','LIMÓN','POMELO','UVA','DURAZNO','CIRUELA','FRUTILLA','KIWI','PALTA','MELON','MELÓN','SANDIA','SANDÍA','HUEVO'],
  Despensa: ['ARROZ','HARINA','FIDEO','ACEITE','LECHE','AZUCAR','AZÚCAR','YERBA','CAFE','CAFÉ','TE ','TÉ ','PAN','YOGUR','QUESO','MANTECA','LENTEJA','POROTO','GARBANZO','POLENTA','AVENA','SAL ','GALLETITA','MERMELADA','DULCE DE LECHE','MAYONESA','ATUN','ATÚN','VINAGRE','PURE DE TOMATE','PURÉ DE TOMATE','DETERGENTE','LAVANDINA','JABON DE TOCADOR','JABÓN DE TOCADOR'],
} satisfies Record<ReferenceCategory, string[]>;
const categories = Object.keys(REFERENCE_PREFIXES) as ReferenceCategory[];
export function catalogReferenceCategory(name: string): ReferenceCategory | null {
  const text = normalizeSearch(name);
  if (/\b(semilla|semillas|jabon|shampoo|aderezo|juguete|perro|gato|snack|tutu|disfraz|mascota|sintetico|semisintetico|motor|lubricante|corporal|bronceador|facial)\b|\d{1,2}w\d{2}/.test(text) && !/^jabon de tocador/.test(text)) return null;
  if (/^(picada|molida|carne)\b/.test(text)) return isGroundMeatName(name) || /^carne (?:de )?(?:novillo|vacuna|cerdo|ternera|res)\b/.test(text) ? 'Carnicería' : null;
  for (const category of categories) {
    if (!REFERENCE_PREFIXES[category].some(prefix => new RegExp('^'+normalizeSearch(prefix)+'(?:s|es)?(?:\\b|-)').test(text))) continue;
    if (category === 'Carnicería' && /\b(sabor|relleno|rebozad|cocid|crocante|crocan|salsa)\b/.test(text)) return null;
    if (category === 'Verdulería' && /\b(fritas?|pure|polvo|salsa|conserva|almibar|pelado|pelados|triturado|pulpa|seco|secos|deshidratad\w*|encurtid\w*|sabor|chocolate|chocolat|pascua|kinder)\b/.test(text)) return null;
    return category;
  }
  return null;
}
export interface CatalogReferenceRow extends MarketReference {
  minimum: number; maximum: number; observations: number; stores: string[]; date: string;
}
export function referencePresentation(value: string): {quantity: number; unit: ReferenceUnit} | null {
  const m=value.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|unidad(?:es)?|docena(?:s)?)$/i);
  if (!m || Number(m[1].replace(',','.'))<=0) return null;
  const raw=m[2].toLowerCase();
  return {quantity:Number(m[1].replace(',','.')),unit:(raw.startsWith('unidad')?'unidad':raw.startsWith('docena')?'docena':raw) as ReferenceUnit};
}
