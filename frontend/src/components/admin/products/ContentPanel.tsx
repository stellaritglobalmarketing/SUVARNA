"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { getProducts, updateProductContent, type AdminProduct, type ContentInput } from "@/lib/api/admin";
import { AdminButton, Card, inputClass, useAdminMutation } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";

type Refresh = { invalidate: unknown[][] };

const BENEFIT_SUGGESTIONS = ["Heart Health", "Keto Friendly", "Diabetic Friendly", "High Protein", "Weight Management", "Immunity Boost"];

interface Column<Row> {
  key: keyof Row;
  label: string;
  type?: "text" | "number";
  width?: string;
  placeholder?: string;
  maxLength?: number;
}

/** Editable list of rows (add / remove / reorder). Row order is the order shown on the product page. */
function RowsEditor<Row extends Record<string, string | number | null>>({
  rows,
  onChange,
  columns,
  blank,
  addLabel,
}: {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  columns: Column<Row>[];
  blank: Row;
  addLabel: string;
}) {
  const update = (index: number, key: keyof Row, value: string) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index: number, delta: number) => {
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="hidden gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-ink/50 sm:flex">
          {columns.map((c) => (
            <span key={String(c.key)} className={c.width ?? "flex-1"}>
              {c.label}
            </span>
          ))}
          <span className="w-24" />
        </div>
      )}
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {columns.map((c) => (
            <input
              key={String(c.key)}
              type={c.type ?? "text"}
              aria-label={c.label}
              value={row[c.key] ?? ""}
              maxLength={c.maxLength}
              placeholder={c.placeholder}
              onChange={(e) => update(index, c.key, e.target.value)}
              className={cn(inputClass, c.width ?? "flex-1")}
            />
          ))}
          <div className="flex w-24 shrink-0 justify-end">
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1.5 hover:bg-brand-sand disabled:opacity-30 cursor-pointer">
              <ArrowUp size={14} />
            </button>
            <button type="button" aria-label="Move down" disabled={index === rows.length - 1} onClick={() => move(index, 1)} className="rounded p-1.5 hover:bg-brand-sand disabled:opacity-30 cursor-pointer">
              <ArrowDown size={14} />
            </button>
            <button type="button" aria-label="Remove row" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="rounded p-1.5 text-red-600 hover:bg-red-50 cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <AdminButton size="sm" variant="outline" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus size={13} /> {addLabel}
      </AdminButton>
    </div>
  );
}

function Section({ title, hint, children, onSave, isSaving }: { title: string; hint: string; children: ReactNode; onSave: () => void; isSaving: boolean }) {
  return (
    <Card
      title={title}
      actions={
        <AdminButton size="sm" loading={isSaving} onClick={onSave}>
          Save
        </AdminButton>
      }
    >
      <p className="-mt-2 mb-4 text-xs text-brand-ink/60">{hint}</p>
      {children}
    </Card>
  );
}

/** Saves one section of the product-page content. */
function useSectionSave(productId: number, label: string, refresh: Refresh) {
  return useAdminMutation((body: ContentInput) => updateProductContent(productId, body), { success: `${label} saved`, ...refresh });
}

type CertRow = { label: string; description: string | null };

/** Everything on the product page below the basics: badges, health benefits and related products. */
export function ContentPanel({ product, refresh }: { product: AdminProduct; refresh: Refresh }) {
  const [certs, setCerts] = useState<CertRow[]>(product.certifications);
  const [benefits, setBenefits] = useState<string[]>(product.health_benefits);
  const [benefitDraft, setBenefitDraft] = useState("");
  const [related, setRelated] = useState<number[]>(product.related_products.map((p) => p.id));

  const { data: allProducts } = useQuery({ queryKey: ["admin", "products", "all"], queryFn: () => getProducts({ limit: 100, sort: "name_asc" }) });

  // One mutation per section so each Save button shows its own spinner.
  const saveCerts = useSectionSave(product.id, "Certifications", refresh);
  const saveBenefits = useSectionSave(product.id, "Health benefits", refresh);
  const saveRelated = useSectionSave(product.id, "Related products", refresh);

  const addBenefit = (value: string) => {
    const benefit = value.trim();
    if (benefit && !benefits.some((b) => b.toLowerCase() === benefit.toLowerCase())) setBenefits([...benefits, benefit]);
    setBenefitDraft("");
  };

  return (
    <div className="space-y-6">
      <Section
        title="Certifications & quality badges"
        hint='Shown as badges on the product page. A label starting with "100%" also appears on product cards.'
        isSaving={saveCerts.isPending}
        onSave={() => saveCerts.mutate({ certifications: certs.map((c) => ({ label: c.label, description: c.description || null })) })}
      >
        <RowsEditor
          rows={certs}
          onChange={setCerts}
          blank={{ label: "", description: "" }}
          addLabel="Add badge"
          columns={[
            { key: "label", label: "Badge", placeholder: "100% Chemical-Free", maxLength: 64, width: "w-56" },
            { key: "description", label: "Description", placeholder: "No fumigation or bleaching.", maxLength: 255 },
          ]}
        />
      </Section>

      <Section title="Health benefits" hint="Tags used for 'Shop by health goal'." isSaving={saveBenefits.isPending} onSave={() => saveBenefits.mutate({ health_benefits: benefits })}>
        <div className="flex flex-wrap gap-2">
          {benefits.map((b) => (
            <span key={b} className="flex items-center gap-1 rounded-full bg-brand-sand px-3 py-1 text-sm">
              {b}
              <button type="button" aria-label={`Remove ${b}`} onClick={() => setBenefits(benefits.filter((x) => x !== b))} className="text-brand-ink/50 hover:text-red-600 cursor-pointer">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex max-w-md gap-2">
          <input
            value={benefitDraft}
            maxLength={64}
            onChange={(e) => setBenefitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBenefit(benefitDraft);
              }
            }}
            placeholder="Type a benefit and press Enter"
            className={inputClass}
          />
          <AdminButton variant="outline" onClick={() => addBenefit(benefitDraft)}>
            Add
          </AdminButton>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BENEFIT_SUGGESTIONS.filter((s) => !benefits.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => addBenefit(s)} className="rounded-full border border-dashed border-brand-sand-dark px-2.5 py-0.5 text-xs text-brand-ink/60 hover:border-brand-forest cursor-pointer">
              + {s}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Frequently bought together"
        hint="Products suggested alongside this one, in the order you pick them."
        isSaving={saveRelated.isPending}
        onSave={() => saveRelated.mutate({ related_product_ids: related })}
      >
        {related.length > 0 && (
          <ol className="mb-3 space-y-1.5">
            {related.map((id, index) => {
              const p = allProducts?.items.find((x) => x.id === id) ?? product.related_products.find((x) => x.id === id);
              return (
                <li key={id} className="flex items-center justify-between rounded-lg bg-brand-sand px-3 py-2 text-sm">
                  <span>
                    {index + 1}. {p?.name ?? `Product #${id}`}
                  </span>
                  <button type="button" aria-label="Remove" onClick={() => setRelated(related.filter((x) => x !== id))} className="text-brand-ink/50 hover:text-red-600 cursor-pointer">
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        <select
          value=""
          onChange={(e) => e.target.value && setRelated([...related, Number(e.target.value)])}
          className={cn(inputClass, "max-w-md")}
          aria-label="Add related product"
        >
          <option value="">+ Add a product…</option>
          {allProducts?.items
            .filter((p) => p.id !== product.id && !related.includes(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </Section>
    </div>
  );
}
