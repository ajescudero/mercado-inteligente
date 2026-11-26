/* Icons exported unchanged from Omar Yassir's Grocery App (CC BY 4.0). */
export function DesignIcon({name}:{name:'home'|'basket'|'plus'|'back'|'search'|'apple'|'broccoli'|'cheese'|'meat'}) {
  // Preserve the intrinsic SVG dimensions from Figma.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`design-icon design-icon-${name}`} src={`/design/grocery/${name}.svg`} alt="" aria-hidden="true"/>;
}
