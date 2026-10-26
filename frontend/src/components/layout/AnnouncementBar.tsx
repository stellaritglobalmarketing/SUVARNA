/** The site-wide top banner (Admin → Settings), e.g. "FREE Delivery Across India · Diwali orders: order by 1 Nov". */
export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-brand-gold px-4 py-2 text-center text-xs font-semibold tracking-wide text-brand-ink sm:text-[13px]" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      {text}
    </div>
  );
}
