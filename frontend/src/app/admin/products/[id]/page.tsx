"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { deleteProduct, getProduct, setProductStatus, updateProduct, type ProductInput } from "@/lib/api/admin";
import { ActivePill, AdminButton, Card, PageHeader, confirmAction, useAdminMutation } from "@/components/admin/ui";
import { ProductDetailsForm } from "@/components/admin/products/ProductDetailsForm";
import { VariantsPanel } from "@/components/admin/products/VariantsPanel";
import { ImagesPanel } from "@/components/admin/products/ImagesPanel";
import { ContentPanel } from "@/components/admin/products/ContentPanel";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "details", label: "Details" },
  { key: "variants", label: "Variants & Stock" },
  { key: "images", label: "Images" },
  { key: "content", label: "Page Content" },
] as const;

function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get("tab") ?? "details";

  const queryKey = ["admin", "product", productId];
  const { data: product, isLoading, isError } = useQuery({ queryKey, queryFn: () => getProduct(productId), enabled: Number.isInteger(productId) });
  // Anything that changes a product also changes the lists and the storefront's cached pages.
  const refresh = { invalidate: [queryKey, ["admin", "products"], ["admin", "inventory"], ["admin", "dashboard"], ["products"]] };

  const save = useAdminMutation((values: ProductInput) => updateProduct(productId, values), { success: "Product saved", ...refresh });
  const toggle = useAdminMutation((active: boolean) => setProductStatus(productId, active), { success: "Product updated", ...refresh });
  const remove = useAdminMutation(() => deleteProduct(productId), {
    success: "Product deleted",
    invalidate: [["admin", "products"], ["admin", "dashboard"]],
    onSuccess: () => router.replace("/admin/products"),
  });

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  if (isError || !product) {
    return (
      <p className="text-sm text-red-600">
        Product not found. <Link href="/admin/products" className="underline">Back to products</Link>
      </p>
    );
  }

  const noVariants = product.variants.filter((v) => v.is_active).length === 0;

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-brand-ink/60 hover:text-brand-forest">
        <ArrowLeft size={14} /> Products
      </Link>
      <PageHeader
        title={product.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <ActivePill active={product.is_active} />
            <span className="text-brand-ink/50">/products/{product.slug}</span>
          </span>
        }
        actions={
          <>
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-sand-dark bg-white px-4 py-2 text-sm font-medium text-brand-forest hover:border-brand-forest"
            >
              View on store <ExternalLink size={13} />
            </a>
            <AdminButton variant="outline" loading={toggle.isPending} onClick={() => toggle.mutate(!product.is_active)}>
              {product.is_active ? "Hide from store" : "Make live"}
            </AdminButton>
            <AdminButton
              variant="danger"
              loading={remove.isPending}
              onClick={() => confirmAction(`Delete "${product.name}"? It disappears from the store and admin lists. Past orders keep their record.`) && remove.mutate(undefined)}
            >
              Delete
            </AdminButton>
          </>
        }
      />

      {noVariants && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This product has no active variants, so it isn&apos;t shown on the store yet. Add a pack size with a price under{" "}
          <button type="button" className="font-semibold underline cursor-pointer" onClick={() => router.replace(`${pathname}?tab=variants`)}>
            Variants & Stock
          </button>
          .
        </p>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-brand-sand-dark">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => router.replace(`${pathname}?tab=${t.key}`, { scroll: false })}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              tab === t.key ? "border-brand-forest text-brand-forest" : "border-transparent text-brand-ink/60 hover:text-brand-forest",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <Card>
          <ProductDetailsForm key={product.updated_at} product={product} isSaving={save.isPending} onSubmit={(values) => save.mutate(values)} submitLabel="Save details" />
        </Card>
      )}
      {tab === "variants" && <VariantsPanel product={product} refresh={refresh} />}
      {tab === "images" && <ImagesPanel product={product} refresh={refresh} />}
      {tab === "content" && <ContentPanel product={product} refresh={refresh} />}
    </div>
  );
}

export default function AdminProductPage() {
  return (
    <Suspense fallback={null}>
      <ProductEditor />
    </Suspense>
  );
}
