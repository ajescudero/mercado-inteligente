export type ReferenceCategory = 'Carnicería' | 'Verdulería' | 'Despensa';
export type ReferenceUnit = 'kg' | 'g' | 'l' | 'ml' | 'unidad' | 'docena';
export interface MarketReference {
  id: string;
  name: string;
  category: ReferenceCategory;
  amount: number;
  quantity: number;
  unit: ReferenceUnit;
  presentation: string;
}

// Transcripción verificada de la columna CUYO, cuadro 19, página 12.
// No son precios sugeridos, ofertas ni promedios exclusivos de Mendoza.
export const REFERENCE_SOURCE = {
  name: 'INDEC · IPC, cuadro 19', region: 'Cuyo', period: 'Octubre de 2026',
  periodEnd: '2026-10-31', publishedAt: '2026-11-12', checkedAt: '2026-11-15',
  url: 'https://www.indec.gob.ar/uploads/informesdeprensa/ipc_11_269335F5BA6B.pdf#page=12',
  latestUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
};

export const MARKET_REFERENCES: MarketReference[] = [
  {id:'picada',name:'Carne picada común',category:'Carnicería',amount:10073.45,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'pollo',name:'Pollo entero',category:'Carnicería',amount:4976.69,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'papa',name:'Papa',category:'Verdulería',amount:2696.27,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'huevos',name:'Huevos de gallina',category:'Verdulería',amount:3885.44,quantity:1,unit:'docena',presentation:'1 docena'},
  {id:'pan',name:'Pan francés',category:'Despensa',amount:2667.81,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'harina',name:'Harina de trigo común',category:'Despensa',amount:1113.67,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'arroz',name:'Arroz blanco simple',category:'Despensa',amount:2118.50,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'fideos',name:'Fideos secos tipo guisero',category:'Despensa',amount:1595.69,quantity:500,unit:'g',presentation:'500 g'},
  {id:'aceite',name:'Aceite de girasol',category:'Despensa',amount:6921.27,quantity:1.5,unit:'l',presentation:'1,5 litros'},
  {id:'leche',name:'Leche fresca entera sachet',category:'Despensa',amount:2168.52,quantity:1,unit:'l',presentation:'1 litro'},
  {id:'azucar',name:'Azúcar',category:'Despensa',amount:1558.82,quantity:1,unit:'kg',presentation:'1 kg'},
  {id:'detergente',name:'Detergente líquido',category:'Despensa',amount:2460.18,quantity:750,unit:'ml',presentation:'750 ml'},
  {id:'lavandina',name:'Lavandina',category:'Despensa',amount:1400.32,quantity:1000,unit:'ml',presentation:'1 litro'},
  {id:'jabon',name:'Jabón de tocador',category:'Despensa',amount:1545.37,quantity:125,unit:'g',presentation:'125 g'},
];

const UNITS = {
  kg: {dimension:'mass',factor:1000,label:'kg'}, g:{dimension:'mass',factor:1,label:'g'},
  l: {dimension:'volume',factor:1000,label:'litros'}, ml:{dimension:'volume',factor:1,label:'ml'},
  unidad:{dimension:'count',factor:1,label:'unidades'}, docena:{dimension:'count',factor:12,label:'docenas'},
} as const;

export function compatibleUnits(unit: ReferenceUnit) {
  return (Object.keys(UNITS) as ReferenceUnit[]).filter(key=>UNITS[key].dimension===UNITS[unit].dimension).map(key=>({value:key,label:UNITS[key].label}));
}

export function parseLocalNumber(value: string): number | null {
  const text=value.trim();
  if (!text) return null;
  // Admite 1.500,50, 1500,50 y 1500.50. Un punto con tres cifras es separador de miles.
  const normalized=/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text)?text.replaceAll('.','').replace(',','.'):
    /^\d+(?:[,.]\d{1,2})?$/.test(text)?text.replace(',','.') : '';
  const number=Number(normalized);
  return normalized && Number.isFinite(number) && number>0 && number<=1e9 ? number : null;
}

export function compareReference(reference: MarketReference, price: number, quantity: number, unit: ReferenceUnit) {
  if (!UNITS[unit] || UNITS[unit].dimension!==UNITS[reference.unit].dimension ||
    !Number.isFinite(price) || !Number.isFinite(quantity) || price<=0 || quantity<=0 || price>1e9 || quantity>1e9) return null;
  const equivalentReference=reference.amount * (quantity * UNITS[unit].factor)/(reference.quantity * UNITS[reference.unit].factor);
  const difference=price-equivalentReference;
  return {equivalentReference,difference,percentage:difference/equivalentReference*100};
}

// Pasados dos meses del período, conservamos el dato visible como histórico.
export function isReferenceHistorical(now: Date = new Date()) {
  return now.getTime()-new Date(REFERENCE_SOURCE.periodEnd+'T23:59:59-03:00').getTime()>62*86400000;
}

export const REFERENCE_SOURCES = [
  {id:'mendoza-agricultura',name:'Dirección de Agricultura de Mendoza',category:'Verdulería',kind:'Consumidor final',region:'Mendoza',
    description:'Relevamiento provincial de frutas, hortalizas y huevos para el público.',
    date:'Publicación identificada: 29/09/2026',note:'La descarga no estuvo disponible. Consultá la fecha del listado al abrirlo; sus valores no están incorporados aquí.',
    url:'https://informacionoficial.mendoza.gob.ar/produccion/precios/'},
  {id:'ipcva',name:'Instituto de Promoción de la Carne Vacuna',category:'Carnicería',kind:'Promedio minorista',region:'AMBA, Rosario y Córdoba',
    description:'Precios por corte relevados en carnicerías y supermercados.',date:'Informe: octubre de 2026',
    note:'Sirve como contexto de otras plazas. No representa precios de Mendoza.',
    url:'https://api.carneargentina.org.ar/web/uploads/globals/1/Informe%20Mensual%20de%20Precios%20OCT26_compressed.pdf'},
  {id:'andina',name:'Andina Oeste',category:'Verdulería',kind:'Mayorista comercial',region:'Mendoza',
    description:'Lista de abastecimiento de frutas y hortalizas por caja, bolsa o unidad.',date:'Fecha del precio: consultar en el sitio',
    note:'El costo mayorista no equivale al precio de una verdulería. Revisá kilos por bulto, flete, merma e impuestos.',
    url:'https://www.andinaoeste.com/'},
] as const;
