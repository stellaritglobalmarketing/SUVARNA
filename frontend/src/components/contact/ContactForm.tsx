"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { cn } from "@/lib/utils/cn";

const TOPICS = ["My order", "Return or replacement", "Product question", "Bulk / corporate gifting", "Something else"];

const fieldClass =
  "w-full rounded-xl border border-brand-sand-dark bg-white px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-forest focus:outline-none";

/**
 * Contact form that becomes a WhatsApp message to the store's number — no email server, and the reply
 * comes back in the same chat. Opens WhatsApp in a new tab with everything filled in.
 */
export function ContactForm() {
  const { user } = useAuth();
  const store = useStoreSettings();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState(user?.name ?? "");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const lines = [`*${topic}* — Suvarna7 website`, `Name: ${name.trim()}`];
    if (orderNumber.trim()) lines.push(`Order: ${orderNumber.trim().toUpperCase()}`);
    lines.push("", message.trim());
    window.open(`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-brand-ink">What&apos;s it about?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTopic(item)}
              aria-pressed={topic === item}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                topic === item ? "border-brand-forest bg-brand-forest text-brand-sand" : "border-brand-sand-dark bg-white text-brand-ink/75 hover:border-brand-forest",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-brand-ink">Your name</span>
          <input required maxLength={64} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-brand-ink">
            Order number <span className="font-normal text-brand-ink/50">(if you have one)</span>
          </span>
          <input maxLength={24} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-…" className={fieldClass} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-ink">Your message</span>
        <textarea
          required
          rows={5}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can help."
          className={cn(fieldClass, "resize-y")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-forest px-6 py-3.5 font-semibold text-brand-sand transition-colors hover:bg-brand-forest-light cursor-pointer"
        >
          <Send size={17} /> Send on WhatsApp
        </button>
        <p className="text-sm text-brand-ink/60">Opens WhatsApp with your message ready — just press send.</p>
      </div>
      {sent && (
        <p role="status" className="rounded-xl bg-brand-sand px-4 py-3 text-sm text-brand-ink">
          WhatsApp should have opened in a new tab. If it didn&apos;t, message us at <strong>{store.whatsapp_display}</strong>.
        </p>
      )}
    </form>
  );
}
