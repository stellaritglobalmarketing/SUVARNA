/** The hook line, just under the price. */
export function ProductTagline({ text }: { text: string }) {
  if (!text) return null;
  return <p className="font-serif text-lg italic leading-snug text-brand-walnut-dark">{text}</p>;
}
