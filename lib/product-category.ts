import { isGroundMeatName } from './search-vocabulary';
/** SEPA has no category column. Conservative, local rules; unknowns stay in Otros. */
export function classifyProduct(name: string): { productType: string; category: string } {
  const text = name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const classify = (productType: string, category: string) => ({ productType, category });
  if (/DOG|CAT CHOW|PEDIGREE|WHISKAS|PURINA|ALIM.*(?:PERRO|GATO)|MASCOTA/.test(text)) return classify('Mascotas', 'Alimentos y accesorios para mascotas');
  if (/(?:LIMP|DESOD|ECOVITA|PROCENEX|POETT).*PISO|PISO.*(?:LIMP|DESOD|ECOVITA)/.test(text)) return classify('Limpieza', 'Pisos y superficies');
  if (/LAVANDINA|DETERGENTE|LAVAVAJ|LIMPIA|LIMP |LIMP\.|DESINFECT|SUAVIZANTE|JABON.*(?:ROPA|POLVO)|QUITAMANCHAS|INSECTICIDA|ESPONJA|TRAPO|ESCOBA|SECADOR DE PISO/.test(text)) return classify('Limpieza', /ROPA|SUAVIZ|QUITAMANCH/.test(text) ? 'Cuidado de la ropa' : 'Limpieza del hogar');
  if (/SHAMPOO|ACONDICIONADOR|DESODORANTE|DESOD |ANTITRANSP|DENTIFRICO|DENTAL|JABON|PERFUME|COLONIA|PAÑAL|PANAL|HIGIENIC|TOALLITA|CREMA.*(?:MANOS|CORPORAL|FACIAL)|LECHE.*LIMPIEZA/.test(text)) return classify('Cuidado personal', 'Higiene y cuidado personal');
  if (/^AGUA |GASEOSA|CERVEZA|^VINO | FERNET|^FERNET|WHISKY|VODKA|^JUGO |^JUG /.test(text)) return classify('Bebidas', /CERVEZA|VINO|FERNET|WHISKY|VODKA/.test(text) ? 'Bebidas con alcohol' : 'Bebidas sin alcohol');
  if (/^LECHE /.test(text) && !/DULCE DE LECHE/.test(text)) return classify('Alimentos', 'Lácteos');
  if (/ALFAJOR|GALLET|CARAMELO|CHOCOLATE|CHOCOLATIN|BOMBON|TURRON|DULCE DE LECHE/.test(text)) return classify('Alimentos', 'Galletitas, dulces y golosinas');
  if (/LECHE|YOGUR|QUESO|MANTECA|CREMA DE LECHE|RICOTA/.test(text)) return classify('Alimentos', 'Lácteos');
  if (/^ARROZ |^ARR |LENTEJA|GARBANZO|POROTO|HARINA|FIDEO|PASTA |POLENTA|SEMOLA/.test(text)) return classify('Alimentos', 'Arroz, legumbres, harinas y pastas');
  if (/^HP |^SC |ALBONDIGA|MILANESA|BIFE |HAMBURGUESA/.test(text)) return classify('Alimentos', 'Comidas preparadas');
  if (/^PAN |^PAN$|PANIFIC|TOSTADA|BIZCO|BUDIN/.test(text)) return classify('Alimentos', 'Panificados');
  if (isGroundMeatName(name)) return classify('Alimentos', 'Almacén y frescos');
  if (/ACEITE|VINAGRE|AZUCAR|SAL |^SAL$|YERBA|CAFE|^TE |MATE COCIDO|MERMELADA|MAYONESA|KETCHUP|MOSTAZA|ATUN|SARDINA|PURE|CALDO|SOPA|CEREAL|AVENA|TOMATE|FRUTA|VERDURA|HUEVO|CARNE|POLLO|PESCADO/.test(text)) return classify('Alimentos', 'Almacén y frescos');
  return classify('Otros', 'Sin clasificar');
}
