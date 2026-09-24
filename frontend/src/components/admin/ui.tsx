"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Search, X } from "lucide-react";
import type { PaginationMeta } from "@/lib/api/http";
import { uploadImage } from "@/lib/api/admin";
import { useAppDispatch } from "@/lib/redux/hooks";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { cn } from "@/lib/utils/cn";

// Small shared building blocks for the admin screens.

export const inputClass =
  "w-full rounded-lg border border-brand-sand-dark bg-white px-3 py-2 text-sm outline-none focus:border-brand-forest disabled:bg-brand-sand/60";

export function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------- layout pieces

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-brand-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-brand-sand-dark bg-white p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-serif text-lg font-semibold text-brand-forest">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const variants = {
    primary: "bg-brand-forest text-brand-sand hover:bg-brand-forest-light",
    outline: "border border-brand-sand-dark bg-white text-brand-forest hover:border-brand-forest",
    ghost: "text-brand-forest hover:bg-brand-sand-dark",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variants[variant],
        className,
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- status pills

const STATUS_TONES: Record<string, string> = {
  // order
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  // payment
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-200 text-slate-700",
  // fulfillment
  unfulfilled: "bg-slate-100 text-slate-700",
  fulfilled: "bg-emerald-100 text-emerald-800",
  // shipment
  created: "bg-slate-100 text-slate-700",
  pickup_scheduled: "bg-sky-100 text-sky-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  in_transit: "bg-violet-100 text-violet-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  rto: "bg-red-100 text-red-700",
  // generic
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-600",
  approved: "bg-emerald-100 text-emerald-800",
  low: "bg-red-100 text-red-700",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_TONES[status] ?? "bg-slate-100 text-slate-700")}>
      {label ?? humanize(status)}
    </span>
  );
}

export function ActivePill({ active }: { active: boolean | number }) {
  return <StatusPill status={active ? "active" : "inactive"} />;
}

// ---------------------------------------------------------------- table + states

export function Table({ head, children, minWidth = 720 }: { head: ReactNode[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-sand-dark bg-white">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-brand-sand-dark/50 text-xs uppercase tracking-wide text-brand-ink/60">
          <tr>
            {head.map((cell, index) => (
              <th key={index} className="px-4 py-3 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-sand-dark">{children}</tbody>
      </table>
    </div>
  );
}

export function TableState({
  isLoading,
  isError,
  isEmpty,
  columns,
  emptyText = "Nothing here yet.",
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  columns: number;
  emptyText?: string;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: columns }, (_, col) => (
              <td key={col} className="px-4 py-3">
                <div className="h-4 animate-pulse rounded bg-brand-sand-dark/60" />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
  if (isError || isEmpty) {
    return (
      <tr>
        <td colSpan={columns} className="px-4 py-10 text-center text-sm text-brand-ink/60">
          {isError ? (
            <>
              Couldn&apos;t load this list.{" "}
              {onRetry && (
                <button type="button" onClick={onRetry} className="font-semibold text-brand-forest underline cursor-pointer">
                  Try again
                </button>
              )}
            </>
          ) : (
            emptyText
          )}
        </td>
      </tr>
    );
  }
  return null;
}

export function Pagination({ pagination, onPage }: { pagination?: PaginationMeta; onPage: (page: number) => void }) {
  if (!pagination || pagination.total_pages <= 1) {
    return pagination ? <p className="mt-3 text-xs text-brand-ink/50">{pagination.total} total</p> : null;
  }
  const { current_page: page, total_pages: pages, total } = pagination;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-brand-ink/60">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1">
        <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </AdminButton>
        <AdminButton variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </AdminButton>
      </div>
    </div>
  );
}

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChangeRef.current(draft.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <div className="relative w-full max-w-xs">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
      <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className={cn(inputClass, "pl-9")} />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={cn(inputClass, "w-auto")}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------- forms + modal

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-brand-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-brand-ink/50">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-brand-ink/80">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-forest" />
      {label}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 cursor-pointer" />
      <div className={cn("relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-brand-sand-dark px-5 py-3">
          <h2 className="font-serif text-lg font-semibold text-brand-forest">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-brand-sand-dark cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="text-sm text-red-600">{errorText(error)}</p>;
}

// ---------------------------------------------------------------- image input

/** Image URL field with an "Upload" button that stores the file on the server and fills in the URL. */
export function ImageInput({
  value,
  onChange,
  onUploaded,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Also receives the upload's public id (product images store it). */
  onUploaded?: (upload: { url: string; public_id: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const upload = await uploadImage(file);
      onChange(upload.url);
      onUploaded?.(upload);
    } catch (uploadError) {
      setError(errorText(uploadError));
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" className={inputClass} />
        <AdminButton variant="outline" onClick={() => fileRef.current?.click()} loading={isUploading} className="shrink-0">
          {!isUploading && <ImagePlus size={15} />} Upload
        </AdminButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
        <img src={value} alt="" className="h-20 w-20 rounded-lg border border-brand-sand-dark object-cover" />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- mutations

/** useMutation that toasts the outcome and refreshes the given queries on success. */
export function useAdminMutation<TArgs, TResult = unknown>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  { success, invalidate = [], onSuccess }: { success?: string; invalidate?: QueryKey[]; onSuccess?: (result: TResult, args: TArgs) => void } = {},
) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn,
    onSuccess: (result, args) => {
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (success) dispatch(pushToast(success, "success"));
      onSuccess?.(result, args);
    },
    onError: (error) => {
      dispatch(pushToast(errorText(error), "error"));
    },
  });
}

/** Asks before running a destructive action. */
export function confirmAction(message: string): boolean {
  return typeof window !== "undefined" && window.confirm(message);
}
