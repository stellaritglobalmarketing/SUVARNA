"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth/token";
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from "@/lib/api/addresses";
import { queryKeys } from "@/lib/query/keys";
import type { Address, AddressInput } from "@/types/address";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddressForm } from "@/components/checkout/AddressForm";

const TYPE_LABEL: Record<Address["address_type"], string> = { home: "Home", work: "Work", other: "Other" };

/** Address → the full body PUT /user/addresses/:id expects (it replaces every field). */
function toInput(address: Address): AddressInput {
  return {
    full_name: address.full_name,
    phone: address.phone,
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? undefined,
    landmark: address.landmark ?? undefined,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    address_type: address.address_type,
    is_default: address.is_default,
  };
}

const errorMessage = (error: unknown) => (error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.");

/** The customer's saved delivery addresses: add, edit, delete, and choose the default. */
export function MyAddressesClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && user?.role === "user";

  // The session is restored from storage after the first render — check storage before redirecting.
  useEffect(() => {
    if (!isAuthenticated && !getToken()) {
      router.replace(`/login?next=${encodeURIComponent("/addresses")}`);
    }
  }, [isAuthenticated, router]);

  const { data: addresses = [], isLoading, isError, refetch, isSuccess } = useQuery({
    queryKey: queryKeys.addresses,
    queryFn: fetchAddresses,
    enabled: isCustomer,
  });

  // "new" for the add form, an address id while editing, null when no form is open.
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses });

  const save = useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: AddressInput }) => (id ? updateAddress(id, input) : createAddress(input)),
    onSuccess: () => {
      refresh();
      setEditing(null);
    },
  });
  const remove = useMutation({ mutationFn: (id: number) => deleteAddress(id), onSuccess: refresh });
  const makeDefault = useMutation({
    mutationFn: (address: Address) => updateAddress(address.id, { ...toInput(address), is_default: true }),
    onSuccess: refresh,
  });

  const openForm = (target: "new" | number) => {
    save.reset();
    setEditing(target);
  };

  const editingAddress = typeof editing === "number" ? addresses.find((a) => a.id === editing) : undefined;

  const form =
    editing !== null ? (
      <div className="animate-tab-in rounded-2xl border border-brand-sand-dark bg-white p-5 sm:p-6">
        <h3 className="mb-4 font-serif text-lg font-semibold text-brand-forest">{editingAddress ? "Edit address" : "Add a new address"}</h3>
        <AddressForm
          key={editing}
          defaults={
            editingAddress
              ? toInput(editingAddress)
              : { full_name: user?.name ?? "", phone: user?.phone ?? "", is_default: addresses.length === 0 }
          }
          isSaving={save.isPending}
          error={save.isError ? errorMessage(save.error) : null}
          onSubmit={(input) => save.mutate({ id: editingAddress?.id ?? null, input })}
          onCancel={() => setEditing(null)}
        />
      </div>
    ) : null;

  return (
    <Container className="py-10">
        <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Your Account" title="My Addresses" subtitle="Saved addresses show up at checkout, so you don't have to type them again." />
        {isSuccess && addresses.length > 0 && editing !== "new" && (
          <Button onClick={() => openForm("new")}>
            <Plus size={16} /> Add Address
          </Button>
        )}
      </div>

      {isAuthenticated && !isCustomer && <p className="mt-8 text-brand-ink/70">Addresses are available for customer accounts only.</p>}

      {(!isAuthenticated || (isCustomer && isLoading)) && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="mt-8 flex flex-col items-start gap-3">
          <p className="text-sm text-red-600">We couldn&apos;t load your addresses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {editing === "new" && <div className="mt-8">{form}</div>}

      {isSuccess && addresses.length === 0 && editing === null && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand-dark py-16 text-center">
          <MapPin size={40} className="text-brand-ink/30" />
          <div>
            <p className="font-medium text-brand-forest">No saved addresses yet</p>
            <p className="mt-1 text-sm text-brand-ink/60">Add one now and checkout will be quicker next time.</p>
          </div>
          <Button onClick={() => openForm("new")}>
            <Plus size={16} /> Add Address
          </Button>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) =>
            editing === address.id ? (
              <li key={address.id} className="sm:col-span-2">
                {form}
              </li>
            ) : (
              <li
                key={address.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 ${address.is_default ? "border-brand-forest" : "border-brand-sand-dark"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-brand-ink">{address.full_name}</p>
                  <span className="rounded-full bg-brand-sand px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-ink/70">
                    {TYPE_LABEL[address.address_type]}
                  </span>
                  {address.is_default && (
                    <span className="rounded-full bg-brand-forest px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-sand">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-brand-ink/70">
                  {[address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ")}
                  <br />
                  {address.city}, {address.state} – {address.pincode}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-ink/70">
                  <Phone size={14} /> {address.phone}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-brand-sand-dark pt-4">
                  <Button variant="outline" size="sm" onClick={() => openForm(address.id)}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => window.confirm("Delete this address?") && remove.mutate(address.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                  {!address.is_default && (
                    <button
                      type="button"
                      disabled={makeDefault.isPending}
                      onClick={() => makeDefault.mutate(address)}
                      className="ml-auto text-sm font-semibold text-brand-forest underline underline-offset-4 disabled:opacity-50 cursor-pointer"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {(remove.isError || makeDefault.isError) && (
        <p className="mt-4 text-sm text-red-600">{errorMessage(remove.error ?? makeDefault.error)}</p>
      )}
        </div>
      </Container>
  );
}
