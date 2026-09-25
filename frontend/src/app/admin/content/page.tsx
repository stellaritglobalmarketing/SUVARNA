"use client";

import { Suspense, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import {
  HIGHLIGHT_ICONS,
  createContent,
  deleteContent,
  getContent,
  getProducts,
  setContentStatus,
  updateContent,
  type ContentItem,
  type ContentResource,
} from "@/lib/api/admin";
import { getHomeIcon } from "@/lib/utils/homeIcons";
import { ActivePill, AdminButton, Field, ImageInput, Modal, PageHeader, confirmAction, humanize, inputClass, useAdminMutation } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "image" | "icon";
  required?: boolean;
  max?: number;
  options?: readonly string[];
  hint?: string;
  wide?: boolean;
};

type ResourceDef = {
  key: ContentResource;
  label: string;
  singular: string;
  description: string;
  fields: FieldDef[];
  title: (item: ContentItem) => string;
  subtitle?: (item: ContentItem) => string | null;
  groupBy?: string;
};

const PLACEMENT_LABELS: Record<string, string> = {
  hero: "Desktop hero",
  promo: "Mobile promo banner",
  trust_badge: "Mobile trust strip",
  trust_point: "Trust section",
};

// Mirrors the backend's admin-content-controller.js field rules.
const RESOURCES: ResourceDef[] = [
  {
    key: "banners",
    label: "Banners",
    singular: "banner",
    description: "The big image at the top of the home page — the desktop hero and the mobile promo banner. The first active one per placement is shown.",
    groupBy: "placement",
    fields: [
      { key: "placement", label: "Where", type: "select", options: ["hero", "promo"], required: true },
      { key: "eyebrow", label: "Small label above the title", max: 64 },
      { key: "title", label: "Title", required: true, max: 160, wide: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", max: 512, wide: true },
      { key: "image_url", label: "Background image", type: "image", required: true, wide: true },
      { key: "image_alt", label: "Image description (alt)", max: 160, wide: true },
      { key: "cta_label", label: "Button text", max: 64 },
      { key: "cta_href", label: "Button link", max: 255, hint: "e.g. /#products" },
      { key: "secondary_cta_label", label: "2nd button text", max: 64 },
      { key: "secondary_cta_href", label: "2nd button link", max: 255 },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    title: (i) => String(i.title),
    subtitle: (i) => (i.eyebrow as string) ?? null,
  },
  {
    key: "highlights",
    label: "Highlights",
    singular: "highlight",
    description: "Icon + text points: under the hero, the mobile trust strip, and the “Why Suvarna7” trust section.",
    groupBy: "placement",
    fields: [
      { key: "placement", label: "Where", type: "select", options: ["hero", "trust_badge", "trust_point"], required: true },
      { key: "icon", label: "Icon", type: "icon", options: HIGHLIGHT_ICONS, required: true },
      { key: "title", label: "Title", required: true, max: 128, wide: true },
      { key: "description", label: "Description", type: "textarea", max: 255, wide: true },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    title: (i) => String(i.title),
    subtitle: (i) => (i.description as string) ?? null,
  },
  {
    key: "hampers",
    label: "Hampers",
    singular: "hamper",
    description: "Gift hamper themes. Clicking one opens the hamper builder with its products pre-selected.",
    fields: [
      { key: "name", label: "Name", required: true, max: 128 },
      { key: "subtitle", label: "Subtitle", max: 255 },
      { key: "image_url", label: "Image", type: "image", wide: true },
      { key: "slug", label: "URL slug", max: 160, hint: "Leave empty to generate from the name." },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    title: (i) => String(i.name),
    subtitle: (i) => ((i.products as { name: string }[]) ?? []).map((p) => p.name).join(", ") || "No products",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    description: "Customer quotes in “What Our Customers Say”.",
    fields: [
      { key: "customer_name", label: "Customer name", required: true, max: 64 },
      { key: "location", label: "City, State", max: 128 },
      { key: "rating", label: "Stars (1–5)", type: "select", options: ["5", "4", "3", "2", "1"], required: true },
      { key: "quote", label: "Quote", type: "textarea", required: true, max: 1000, wide: true },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    title: (i) => String(i.customer_name),
    subtitle: (i) => `${"★".repeat(Number(i.rating))} ${i.quote as string}`,
  },
  {
    key: "faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions at the bottom of the home page.",
    fields: [
      { key: "question", label: "Question", required: true, max: 255, wide: true },
      { key: "answer", label: "Answer", type: "textarea", required: true, max: 1000, wide: true },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    title: (i) => String(i.question),
    subtitle: (i) => (i.answer as string) ?? null,
  },
];

function ContentForm({ def, item, onClose }: { def: ResourceDef; item: ContentItem | null; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.fields.map((f) => [f.key, item?.[f.key] == null ? (f.type === "select" && f.required ? String(f.options?.[0] ?? "") : f.type === "icon" ? String(f.options?.[0]) : "") : String(item[f.key])])),
  );
  const [productIds, setProductIds] = useState<number[]>(() => ((item?.products as { id: number }[]) ?? []).map((p) => p.id));
  const { data: products } = useQuery({
    queryKey: ["admin", "products", "all"],
    queryFn: () => getProducts({ limit: 100, sort: "name_asc" }),
    enabled: def.key === "hampers",
  });

  const save = useAdminMutation(
    (body: Record<string, unknown>) => (item ? updateContent(def.key, item.id, body) : createContent(def.key, body)),
    { success: `${humanize(def.singular)} saved`, invalidate: [["admin", "content", def.key], ["products", "home"]], onSuccess: onClose },
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const body: Record<string, unknown> = { ...values };
    if (def.key === "hampers") body.product_ids = productIds;
    save.mutate(body);
  };

  return (
    <Modal title={`${item ? "Edit" : "New"} ${def.singular}`} onClose={onClose} wide={def.fields.length > 6}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {def.fields.map((f) => {
          const value = values[f.key] ?? "";
          const set = (v: string) => setValues((prev) => ({ ...prev, [f.key]: v }));
          const label = `${f.label}${f.required ? " *" : ""}`;
          return (
            <Field key={f.key} label={label} hint={f.hint} className={f.wide || f.type === "textarea" ? "sm:col-span-2" : undefined}>
              {f.type === "textarea" ? (
                <textarea rows={3} required={f.required} maxLength={f.max} value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
              ) : f.type === "number" ? (
                <input type="number" min={0} value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
              ) : f.type === "select" ? (
                <select required={f.required} value={value} onChange={(e) => set(e.target.value)} className={inputClass}>
                  {!f.required && <option value="">—</option>}
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {PLACEMENT_LABELS[o] ?? humanize(o)}
                    </option>
                  ))}
                </select>
              ) : f.type === "icon" ? (
                <div className="flex flex-wrap gap-2">
                  {f.options?.map((o) => {
                    const Icon = getHomeIcon(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        title={humanize(o.replace(/-/g, "_"))}
                        onClick={() => set(o)}
                        aria-pressed={value === o}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border cursor-pointer",
                          value === o ? "border-brand-forest bg-brand-forest text-brand-sand" : "border-brand-sand-dark text-brand-forest hover:border-brand-forest",
                        )}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              ) : f.type === "image" ? (
                <ImageInput value={value} onChange={set} />
              ) : (
                <input required={f.required} maxLength={f.max} value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
              )}
            </Field>
          );
        })}

        {def.key === "hampers" && (
          <Field label="Products in this hamper" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {productIds.map((id) => (
                <span key={id} className="flex items-center gap-1 rounded-full bg-brand-sand px-3 py-1 text-sm">
                  {products?.items.find((p) => p.id === id)?.name ?? `#${id}`}
                  <button type="button" aria-label="Remove" onClick={() => setProductIds(productIds.filter((x) => x !== id))} className="text-brand-ink/50 hover:text-red-600 cursor-pointer">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <select value="" onChange={(e) => e.target.value && setProductIds([...productIds, Number(e.target.value)])} className={cn(inputClass, "mt-2")}>
              <option value="">+ Add a product…</option>
              {products?.items
                .filter((p) => !productIds.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Field>
        )}

        <div className="flex gap-2 sm:col-span-2">
          <AdminButton type="submit" loading={save.isPending}>
            Save
          </AdminButton>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

function ResourceList({ def }: { def: ResourceDef }) {
  const [editing, setEditing] = useState<ContentItem | "new" | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "content", def.key], queryFn: () => getContent(def.key) });
  const refresh = { invalidate: [["admin", "content", def.key], ["products", "home"]] };
  const toggle = useAdminMutation(({ id, active }: { id: number; active: boolean }) => setContentStatus(def.key, id, active), { success: "Updated", ...refresh });
  const remove = useAdminMutation((id: number) => deleteContent(def.key, id), { success: "Deleted", ...refresh });

  const groups = new Map<string, ContentItem[]>();
  for (const item of data ?? []) {
    const group = def.groupBy ? String(item[def.groupBy]) : "";
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-brand-ink/60">{def.description}</p>
        <AdminButton onClick={() => setEditing("new")}>
          <Plus size={15} /> New {def.singular}
        </AdminButton>
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load.{" "}
          <button type="button" onClick={() => refetch()} className="underline cursor-pointer">
            Try again
          </button>
        </p>
      )}
      {data && data.length === 0 && <p className="rounded-2xl border border-dashed border-brand-sand-dark py-12 text-center text-sm text-brand-ink/60">Nothing here yet.</p>}

      {[...groups.entries()].map(([group, items]) => (
        <div key={group}>
          {def.groupBy && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/50">{PLACEMENT_LABELS[group] ?? humanize(group)}</h3>}
          <ul className="divide-y divide-brand-sand-dark overflow-hidden rounded-2xl border border-brand-sand-dark bg-white">
            {items.map((item) => {
              const Icon = def.key === "highlights" ? getHomeIcon(String(item.icon)) : null;
              const image = typeof item.image_url === "string" ? item.image_url : null;
              return (
                <li key={item.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !item.is_active && "opacity-60")}>
                  {Icon && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sand text-brand-forest">
                      <Icon size={16} />
                    </span>
                  )}
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
                    <img src={image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-ink">{def.title(item)}</p>
                    {def.subtitle?.(item) && <p className="truncate text-xs text-brand-ink/60">{def.subtitle(item)}</p>}
                  </div>
                  <ActivePill active={item.is_active} />
                  <div className="flex gap-1">
                    <AdminButton size="sm" variant="outline" onClick={() => setEditing(item)}>
                      Edit
                    </AdminButton>
                    <AdminButton size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: item.id, active: !item.is_active })}>
                      {item.is_active ? "Hide" : "Show"}
                    </AdminButton>
                    <AdminButton size="sm" variant="danger" disabled={remove.isPending} onClick={() => confirmAction(`Delete this ${def.singular}?`) && remove.mutate(item.id)}>
                      Delete
                    </AdminButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {editing && <ContentForm def={def} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ContentManager() {
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get("tab") ?? "banners";
  const def = RESOURCES.find((r) => r.key === tab) ?? RESOURCES[0];

  return (
    <>
      <PageHeader title="Home Content" subtitle="Everything on the home page besides products. Changes show on the store right away." />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-brand-sand-dark">
        {RESOURCES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => router.replace(`${pathname}?tab=${r.key}`, { scroll: false })}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium cursor-pointer",
              def.key === r.key ? "border-brand-forest text-brand-forest" : "border-transparent text-brand-ink/60 hover:text-brand-forest",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <ResourceList key={def.key} def={def} />
    </>
  );
}

export default function AdminContentPage() {
  return (
    <Suspense fallback={null}>
      <ContentManager />
    </Suspense>
  );
}
