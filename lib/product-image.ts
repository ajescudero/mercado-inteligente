/** Images are keyed by the exact GTIN, never by a guessed product name. */
export function productImageUrl(ean?: string): string | undefined {
  if (!ean || !/^(?:\d{8}|\d{12,14})$/.test(ean)) return undefined;
  const sum = [...ean.slice(0, -1)].reverse().reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 1 : 3), 0);
  if ((10 - sum % 10) % 10 !== Number(ean.at(-1))) return undefined;
  return `https://imagenes.preciosclaros.gob.ar/productos/${ean}.jpg`;
}
