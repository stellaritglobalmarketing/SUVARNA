"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { getAdminSettings, updateAdminSettings } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import { AdminButton, Card, Field, FormError, PageHeader, inputClass, useAdminMutation } from "@/components/admin/ui";

/** "916353684881" → "6353684881" for the input box. */
const localPart = (number: string) => number.replace(/^91/, "");

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin", "settings"], queryFn: getAdminSettings });
  // null until the admin types; until then the box shows the saved number.
  const [typed, setTyped] = useState<string | null>(null);
  const number = typed ?? (data ? localPart(data.whatsapp_number) : "");

  const save = useAdminMutation((value: string) => updateAdminSettings({ whatsapp_number: value }), {
    success: "WhatsApp number saved",
    invalidate: [["admin", "settings"]],
    // The storefront reads the same setting; refresh it in this browser too.
    onSuccess: () => {
      setTyped(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.storeSettings });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(number);
  };

  const digits = number.replace(/\D/g, "");
  const isValid = /^[6-9]\d{9}$/.test(digits);
  const unchanged = data != null && digits === localPart(data.whatsapp_number);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Store details that apply across the website." />

      <Card title="WhatsApp number">
        <p className="mb-5 max-w-2xl text-sm text-brand-ink/65">
          Order messages, the &ldquo;Chat on WhatsApp&rdquo; and &ldquo;Call us&rdquo; buttons on Help &amp; Support and the Exchange &amp;
          Return Policy, and the paid-order invoice (once the WhatsApp Business API is connected) all use this number. Changes apply
          right away — no redeploy needed. Static pages pick it up within a minute.
        </p>

        {isLoading && <div className="h-24 max-w-md animate-pulse rounded-xl bg-brand-sand" />}
        {isError && <p className="text-sm text-red-600">Couldn&apos;t load the settings. Please refresh.</p>}

        {data && (
          <form onSubmit={handleSubmit} className="grid max-w-md grid-cols-1 gap-4">
            <p className="flex items-center gap-2 text-sm text-brand-ink/70">
              <MessageCircle size={16} className="text-[#25d366]" /> Current: <span className="font-semibold text-brand-ink">{data.whatsapp_display}</span>
            </p>
            <Field label="New WhatsApp number" hint="10-digit Indian mobile number. +91 is added automatically.">
              <div className="flex items-stretch overflow-hidden rounded-lg border border-brand-sand-dark focus-within:border-brand-forest">
                <span className="flex items-center bg-brand-sand px-3 text-sm font-medium text-brand-ink/70">+91</span>
                <input
                  inputMode="numeric"
                  maxLength={14}
                  value={number}
                  onChange={(e) => setTyped(e.target.value.replace(/[^\d\s-]/g, ""))}
                  placeholder="6353684881"
                  className={`${inputClass} rounded-none border-0 focus:ring-0`}
                />
              </div>
            </Field>
            {number && !isValid && <p className="-mt-2 text-xs text-red-600">Enter a 10-digit mobile number starting with 6, 7, 8 or 9.</p>}
            <FormError error={save.error} />
            <div className="flex items-center gap-3">
              <AdminButton type="submit" disabled={!isValid || unchanged} loading={save.isPending}>
                Save number
              </AdminButton>
              {isValid && (
                <a
                  href={`https://wa.me/91${digits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand-forest underline underline-offset-4"
                >
                  Test on WhatsApp
                </a>
              )}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
