"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createProduct, type ProductInput } from "@/lib/api/admin";
import { Card, PageHeader, useAdminMutation } from "@/components/admin/ui";
import { ProductDetailsForm } from "@/components/admin/products/ProductDetailsForm";

export default function NewProductPage() {
  const router = useRouter();
  const create = useAdminMutation((values: ProductInput) => createProduct(values), {
    success: "Product created — now add its variants, stock and photos",
    invalidate: [["admin", "products"], ["admin", "dashboard"]],
    onSuccess: (product) => router.replace(`/admin/products/${product.id}?tab=variants`),
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-brand-ink/60 hover:text-brand-forest">
        <ArrowLeft size={14} /> Products
      </Link>
      <PageHeader title="New product" subtitle="Start with the basics. Variants (pack sizes & prices), stock and photos come next." />
      <Card>
        <ProductDetailsForm isSaving={create.isPending} onSubmit={(values) => create.mutate(values)} submitLabel="Create product" />
      </Card>
    </div>
  );
}
