import { vocabularyIntent } from './search-vocabulary';
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export function catalogQuery(query: string) {
  const intent = vocabularyIntent(query);
  const { terms, floorCleaner, groundMeat, freshPepper } = intent;
  if (!terms.length) return { where: '0', params: [] as string[], rank: '(0+0)', rankParams: [] as string[] };
  const groups = floorCleaner ? intent.groups.filter(group => !/^(desodorantes?|limpiadores?|limpiador|limpia|pisos?)$/.test(group[0])) : intent.groups;
  const searchTerms = groups.map(group => group[0]);
  const params: string[] = [];
  const conditions: string[] = groups.map(group => {
    const variants=group.flatMap(term => term === "morron" ? [term,"morrón","MORRÓN"] : term === "comun" ? [term,"común","COMÚN"] : [term]);
    params.push(...variants.map(term => `%${escapeLike(term)}%`));
    return '(' + variants.map(() => "p.description LIKE ? ESCAPE '\\'").join(' OR ') + ')';
  });
  if (groundMeat) {
    conditions.push("(p.description LIKE 'PICADA %' OR p.description LIKE 'MOLIDA %' OR p.description LIKE '%CARNE%')");
    for (const unrelated of ['FIAMBR','SALAME','PIMIENTA','ALIMENTO','ALIM.','PERRO','GATO','CALDO','SOPA','RELLENO','EMPANADA','RAVIOL','SOJA']) {
      conditions.push("p.description NOT LIKE ? ESCAPE '\\'");
      params.push(`%${unrelated}%`);
    }
  }
  if (freshPepper) {
    for (const unrelated of ['CONSERVA','POLVO','MOLIDO','PIMENTON','PICANTE']) {
      conditions.push("p.description NOT LIKE ? ESCAPE '\\'");
      params.push(`%${unrelated}%`);
    }
  }
  if (floorCleaner) {
    conditions.push("(p.description LIKE '%PISO%' AND (p.description LIKE '%LIMP%' OR p.description LIKE '%DESOD%' OR p.description LIKE '%ECOVITA%'))");
  }
  // For milk, match the product itself instead of sweets/cosmetics containing it.
  if (terms[0] === 'leche' && !terms.includes('dulce')) {
    conditions.push("(p.description LIKE 'LECHE %' OR p.description LIKE '% LECHE %')");
    for (const unrelated of ['DULCE DE LECHE', 'ALFAJOR', 'GALLET', 'CHOCOLATIN', 'TABLETA', 'FLAN', 'CARAMELO', 'BOMBON', 'JABON', 'POSTRE', 'BARRA ', 'PAN ', 'CREMA CORPORAL', 'SHAMPOO']) {
      conditions.push("p.description NOT LIKE ? ESCAPE '\\'");
      params.push(`%${unrelated}%`);
    }
  }
  // Prefix matches precede incidental mentions, then prices sort within relevance.
  return { where: conditions.join(' AND '), params,
    rank: "CASE WHEN p.description LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END",
    rankParams: [`${escapeLike(searchTerms.join(' ') || 'LIMP')}%`] };
}
