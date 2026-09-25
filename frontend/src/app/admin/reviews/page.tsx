"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { deleteReview, getReviews, setReviewApproved } from "@/lib/api/admin";
import { RatingStars } from "@/components/ui/RatingStars";
import { AdminButton, PageHeader, Pagination, confirmAction, formatDateTime, useAdminMutation } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";
import { cn } from "@/lib/utils/cn";

const FILTERS = ["status"] as const;
const REFRESH = { invalidate: [["admin", "reviews"], ["admin", "dashboard"], ["products"], ["reviews"]] };

function ReviewsList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const status = filters.status === "approved" ? "approved" : "pending";
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "reviews", status, page],
    queryFn: () => getReviews({ status, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  const approve = useAdminMutation(({ id, approved }: { id: number; approved: boolean }) => setReviewApproved(id, approved), {
    success: "Review updated",
    ...REFRESH,
  });
  const remove = useAdminMutation((id: number) => deleteReview(id), { success: "Review deleted", ...REFRESH });

  return (
    <>
      <PageHeader title="Reviews" subtitle="Customer reviews appear on the store — and count towards a product's rating — only after you approve them." />

      <div className="mb-4 flex gap-1 border-b border-brand-sand-dark">
        {(["pending", "approved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter("status", s === "pending" ? "" : s)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium cursor-pointer",
              status === s ? "border-brand-forest text-brand-forest" : "border-transparent text-brand-ink/60 hover:text-brand-forest",
            )}
          >
            {s === "pending" ? "Waiting for approval" : "Approved"}
            {status === s && data?.pagination ? ` (${data.pagination.total})` : ""}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load reviews.{" "}
          <button type="button" onClick={() => refetch()} className="underline cursor-pointer">
            Try again
          </button>
        </p>
      )}
      {data && data.items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-brand-sand-dark py-16 text-center text-sm text-brand-ink/60">
          {status === "pending" ? "No reviews waiting — you're all caught up." : "No approved reviews yet."}
        </p>
      )}

      <ul className={cn("space-y-3", isPlaceholderData && "opacity-60")}>
        {data?.items.map((review) => (
          <li key={review.id} className="rounded-2xl border border-brand-sand-dark bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <RatingStars rating={review.rating} size={14} />
                {review.title && <p className="mt-1 font-semibold text-brand-ink">{review.title}</p>}
              </div>
              <div className="flex gap-1">
                {status === "pending" ? (
                  <AdminButton size="sm" disabled={approve.isPending} onClick={() => approve.mutate({ id: review.id, approved: true })}>
                    Approve
                  </AdminButton>
                ) : (
                  <AdminButton size="sm" variant="outline" disabled={approve.isPending} onClick={() => approve.mutate({ id: review.id, approved: false })}>
                    Hide
                  </AdminButton>
                )}
                <AdminButton size="sm" variant="danger" disabled={remove.isPending} onClick={() => confirmAction("Delete this review?") && remove.mutate(review.id)}>
                  Delete
                </AdminButton>
              </div>
            </div>
            {review.review_text ? (
              <p className="mt-2 whitespace-pre-line text-sm text-brand-ink/80">{review.review_text}</p>
            ) : (
              <p className="mt-2 text-sm italic text-brand-ink/40">Rating only, no written review.</p>
            )}
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-ink/60">
              <span>
                <Link href={`/admin/customers/${review.customer.id}`} className="font-medium text-brand-forest hover:underline">
                  {review.customer.name}
                </Link>{" "}
                on{" "}
                <Link href={`/admin/products/${review.product.id}`} className="font-medium text-brand-forest hover:underline">
                  {review.product.name}
                </Link>
              </span>
              {review.is_verified_purchase && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <BadgeCheck size={12} /> Verified purchase
                </span>
              )}
              <span>· {formatDateTime(review.created_at)}</span>
            </p>
          </li>
        ))}
      </ul>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
    </>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsList />
    </Suspense>
  );
}
