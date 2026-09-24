"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSubCategories, type AdminProduct, type ProductInput } from "@/lib/api/admin";
import { AdminButton, Checkbox, Field, inputClass } from "@/components/admin/ui";

const ORIGINS = ["India", "Kashmir", "Afghanistan", "Iran", "California"];
const PROCESSING = ["Raw", "Traditional", "Smoked", "Roasted & Salted"];

function initialValues(product?: AdminProduct): ProductInput {
  return {
    sub_category_id: product?.sub_category.id ?? 0,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    brand_name: product?.brand_name ?? "Suvarna7",
    origin: product?.origin ?? "",
    processing: product?.processing ?? "",
    delivery_min_days: product?.delivery_min_days ?? 2,
    delivery_max_days: product?.delivery_max_days ?? 5,
    is_featured: product?.is_featured ? 1 : 0,
    is_bestseller: product?.is_bestseller ? 1 : 0,
    sort_order: product?.sort_order ?? 0,
  };
}

/** Basic product fields. Used by both "New product" and the product editor's Details tab. */
export function ProductDetailsForm({
  product,
  isSaving,
  onSubmit,
  submitLabel,
}: {
  product?: AdminProduct;
  isSaving: boolean;
  onSubmit: (values: ProductInput) => void;
  submitLabel: string;
}) {
  const [values, setValues] = useState<ProductInput>(() => initialValues(product));
  const { data: subCategories } = useQuery({ queryKey: ["admin", "subcategories"], queryFn: () => getSubCategories() });
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  // Group sub-categories under their category in the select.
  const groups = new Map<string, { id: number; name: string }[]>();
  for (const sc of subCategories?.items ?? []) {
    const list = groups.get(sc.category_name) ?? [];
    list.push({ id: sc.id, name: sc.name });
    groups.set(sc.category_name, list);
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      ...values,
      slug: values.slug?.trim() || undefined,
      delivery_min_days: Number(values.delivery_min_days),
      delivery_max_days: Number(values.delivery_max_days),
      sort_order: Number(values.sort_order) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Name *">
        <input required maxLength={128} value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Category *" hint={subCategories && subCategories.items.length === 0 ? "Create a category and sub-category first." : undefined}>
        <select required value={values.sub_category_id || ""} onChange={(e) => set("sub_category_id", Number(e.target.value))} className={inputClass}>
          <option value="" disabled>
            Choose…
          </option>
          {[...groups.entries()].map(([category, subs]) => (
            <optgroup key={category} label={category}>
              {subs.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name === category ? category : `${category} › ${sc.name}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Tagline / short description" hint="Shown under the name on the product page." className="md:col-span-2">
        <input maxLength={255} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Description" className="md:col-span-2">
        <textarea rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Origin">
        <input list="origin-options" maxLength={64} value={values.origin} onChange={(e) => set("origin", e.target.value)} className={inputClass} />
        <datalist id="origin-options">
          {ORIGINS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </Field>
      <Field label="Processing">
        <input list="processing-options" maxLength={64} value={values.processing} onChange={(e) => set("processing", e.target.value)} className={inputClass} />
        <datalist id="processing-options">
          {PROCESSING.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </Field>
      <Field label="Delivery estimate (days)">
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={60} value={values.delivery_min_days} onChange={(e) => set("delivery_min_days", Number(e.target.value))} className={inputClass} />
          <span className="text-brand-ink/50">to</span>
          <input type="number" min={0} max={60} value={values.delivery_max_days} onChange={(e) => set("delivery_max_days", Number(e.target.value))} className={inputClass} />
        </div>
      </Field>
      <Field label="Brand">
        <input maxLength={64} value={values.brand_name} onChange={(e) => set("brand_name", e.target.value)} className={inputClass} />
      </Field>
      <Field label="URL slug" hint="Leave empty to generate it from the name.">
        <input maxLength={160} value={values.slug} onChange={(e) => set("slug", e.target.value)} className={inputClass} placeholder="kashmir-mamra-almonds" />
      </Field>
      <Field label="Display order" hint="Lower numbers show first on the home page.">
        <input type="number" min={0} value={values.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className={inputClass} />
      </Field>
      <div className="flex flex-wrap gap-6 md:col-span-2">
        <Checkbox label="Featured" checked={!!values.is_featured} onChange={(c) => set("is_featured", c ? 1 : 0)} />
        <Checkbox label="Best seller badge" checked={!!values.is_bestseller} onChange={(c) => set("is_bestseller", c ? 1 : 0)} />
      </div>
      <div className="md:col-span-2">
        <AdminButton type="submit" loading={isSaving}>
          {submitLabel}
        </AdminButton>
      </div>
    </form>
  );
}
