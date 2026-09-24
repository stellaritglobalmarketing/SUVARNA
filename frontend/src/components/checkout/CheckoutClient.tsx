"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, Plus, ShieldCheck } from "lucide-react";
import type { AddressInput } from "@/types/address";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCartItems, selectCartMrpTotal, selectCartSubtotal, setCartItems } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { getToken } from "@/lib/auth/token";
import { createAddress, fetchAddresses } from "@/lib/api/addresses";
import { fetchServerCart } from "@/lib/api/cart";
import { createPaymentOrder, fetchOrderDetail, placeOrder, verifyPayment } from "@/lib/api/checkout";
import { openRazorpay } from "@/lib/razorpay";
import { queryKeys } from "@/lib/query/keys";
import { formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { AddressForm } from "./AddressForm";

const BRAND_COLOR = "#3d2b1c";
const PLACEHOLDER_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];

type Status = "idle" | "placing" | "opening" | "paying" | "verifying";

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

/**
 * Two stages on one page:
 *  - no `?order=`: review the cart, pick/add an address, then "Place Order & Pay" creates the order
 *  - `?order=ORD-…`: an order that's waiting for payment — pay (or retry) with Razorpay
 * Keeping the pending order in the URL means a closed payment window or a page refresh never
 * loses it, and the customer can't accidentally place the same order twice.
 */
export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingOrder = searchParams.get("order");
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && user?.role === "user";

  const cartItems = useAppSelector(selectCartItems);
  const cartSubtotal = useAppSelector(selectCartSubtotal);
  const cartMrpTotal = useAppSelector(selectCartMrpTotal);

  const [chosenAddressId, setChosenAddressId] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Checkout needs an account (server cart, saved addresses). The session is restored from
  // storage after the first render, so check storage itself before sending anyone to log in.
  useEffect(() => {
    if (!isAuthenticated && !getToken()) {
      const next = pendingOrder ? `/checkout?order=${pendingOrder}` : "/checkout";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, pendingOrder, router]);

  const addressesQuery = useQuery({
    queryKey: queryKeys.addresses,
    queryFn: fetchAddresses,
    enabled: isCustomer && !pendingOrder,
  });
  const addresses = addressesQuery.data ?? [];
  const selectedAddressId = chosenAddressId ?? addresses[0]?.id ?? null;
  const showAddressForm = isAddingAddress || (addressesQuery.isSuccess && addresses.length === 0);

  const orderQuery = useQuery({
    queryKey: queryKeys.orderDetail(pendingOrder ?? ""),
    queryFn: () => fetchOrderDetail(pendingOrder!),
    enabled: isCustomer && Boolean(pendingOrder),
  });

  // Landing back on a pending order that has since been paid (e.g. paid, then refreshed).
  useEffect(() => {
    if (pendingOrder && orderQuery.data?.payment_status === "paid") {
      router.replace(`/checkout/success?order=${encodeURIComponent(pendingOrder)}`);
    }
  }, [orderQuery.data, pendingOrder, router]);

  const saveAddress = useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      setChosenAddressId(address.id);
      setIsAddingAddress(false);
    },
  });

  const goToSuccess = (orderNumber: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(orderNumber) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.allMine });
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  };

  const startPayment = async (orderNumber: string) => {
    setError(null);
    setNotice(null);
    setStatus("opening");
    try {
      const paymentOrder = await createPaymentOrder(orderNumber);
      if (paymentOrder.already_paid) {
        goToSuccess(orderNumber);
        return;
      }
      await openRazorpay(
        {
          key: paymentOrder.key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: paymentOrder.name,
          description: paymentOrder.description,
          order_id: paymentOrder.razorpay_order_id,
          prefill: paymentOrder.prefill,
          theme: { color: BRAND_COLOR },
          handler: async (response) => {
            setStatus("verifying");
            try {
              await verifyPayment(orderNumber, response);
              goToSuccess(orderNumber);
            } catch (verifyError) {
              setStatus("idle");
              setError(errorText(verifyError));
            }
          },
          modal: {
            ondismiss: () => {
              setStatus("idle");
              setNotice("Payment wasn't completed. Your order is saved — you can pay whenever you're ready.");
            },
          },
        },
        (message) => dispatch(pushToast(message, "error")),
      );
      setStatus("paying");
    } catch (paymentError) {
      setStatus("idle");
      setError(errorText(paymentError));
    }
  };

  const handlePlaceOrder = async () => {
    if (selectedAddressId == null) {
      setError("Please add a delivery address.");
      return;
    }
    setError(null);
    setStatus("placing");
    try {
      // The order is built from the server's cart, so make sure the customer is looking at it.
      const serverCart = await fetchServerCart();
      dispatch(setCartItems(serverCart));
      const serverSubtotal = serverCart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      if (serverCart.length === 0) {
        setStatus("idle");
        setError("Your cart is empty.");
        return;
      }
      if (serverSubtotal !== cartSubtotal) {
        setStatus("idle");
        setError("Your cart was updated with the latest prices and stock. Please review it and try again.");
        return;
      }

      const order = await placeOrder(selectedAddressId, notes.trim());
      dispatch(setCartItems([])); // the server emptied the cart when it created the order
      router.replace(`/checkout?order=${encodeURIComponent(order.order_number)}`);
      await startPayment(order.order_number);
    } catch (placeError) {
      setStatus("idle");
      setError(errorText(placeError));
    }
  };

  const busyLabel: Partial<Record<Status, string>> = {
    placing: "Placing order…",
    opening: "Opening payment…",
    paying: "Complete payment in the popup…",
    verifying: "Confirming payment…",
  };
  const isBusy = status !== "idle";

  if (!isAuthenticated) {
    return (
      <Container className="py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-8 h-64 w-full" />
      </Container>
    );
  }

  if (!isCustomer) {
    return (
      <Container className="py-20 text-center">
        <p className="text-brand-ink/70">Checkout is available for customer accounts only.</p>
      </Container>
    );
  }

  // ---- Stage 2: an order waiting for payment ----
  if (pendingOrder) {
    const order = orderQuery.data;
    return (
      <Container className="py-10">
        <SectionHeading eyebrow="Checkout" title="Complete Your Payment" />
        {orderQuery.isLoading && <Skeleton className="mt-8 h-64 w-full" />}
        {orderQuery.isError && (
          <p className="mt-8 text-sm text-red-600">We couldn&apos;t find that order. It may belong to another account.</p>
        )}
        {order && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
                <p className="text-sm text-brand-ink/60">Order</p>
                <p className="font-serif text-xl font-semibold text-brand-forest">{order.order_number}</p>
                {order.order_status === "cancelled" ? (
                  <p className="mt-2 text-sm text-red-600">This order was cancelled and can no longer be paid.</p>
                ) : (
                  <p className="mt-2 text-sm text-brand-ink/70">
                    Your items are reserved. Pay now to confirm the order and we&apos;ll start packing it.
                  </p>
                )}
              </div>
              <DeliverTo address={order.shipping_address} />
            </div>
            <SummaryCard
              lines={order.items.map((item) => ({
                key: `${item.product_name}-${item.variant_name}`,
                name: item.product_name,
                variant: item.variant_name,
                quantity: item.quantity,
                total: item.total_price,
                image: item.image_url ?? "",
              }))}
              subtotal={order.subtotal}
              total={order.total_amount}
            >
              {order.order_status !== "cancelled" && (
                <Button className="mt-5 w-full" size="lg" disabled={isBusy} onClick={() => startPayment(order.order_number)}>
                  <ShieldCheck size={18} /> {busyLabel[status] ?? `Pay ${formatInr(order.total_amount)}`}
                </Button>
              )}
              <Messages notice={notice} error={error} />
            </SummaryCard>
          </div>
        )}
      </Container>
    );
  }

  // ---- Stage 1: cart + address ----
  if (cartItems.length === 0 && status === "idle") {
    return (
      <Container className="py-10">
        <SectionHeading eyebrow="Checkout" title="Delivery & Payment" />
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
          <p className="text-brand-ink/70">Your cart is empty.</p>
          <Button href="/#products">Browse Products</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <SectionHeading eyebrow="Checkout" title="Delivery & Payment" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-brand-sand-dark bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-brand-forest">
                <MapPin size={18} /> Delivery Address
              </h3>
              {addresses.length > 0 && !showAddressForm && (
                <Button variant="ghost" size="sm" onClick={() => setIsAddingAddress(true)}>
                  <Plus size={14} /> Add New
                </Button>
              )}
            </div>

            {addressesQuery.isLoading && <Skeleton className="mt-4 h-24 w-full" />}
            {addressesQuery.isError && (
              <p className="mt-4 text-sm text-red-600">Couldn&apos;t load your addresses. Please refresh the page.</p>
            )}

            {!showAddressForm && addresses.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((address) => {
                  const selected = address.id === selectedAddressId;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setChosenAddressId(address.id)}
                      aria-pressed={selected}
                      className={cn(
                        "relative rounded-xl border p-4 text-left text-sm cursor-pointer",
                        selected ? "border-brand-forest bg-brand-forest/5" : "border-brand-sand-dark hover:border-brand-forest",
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-forest text-brand-sand">
                          <Check size={12} />
                        </span>
                      )}
                      <p className="pr-6 font-semibold text-brand-ink">
                        {address.full_name}
                        <span className="ml-2 rounded-md bg-brand-sand px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-walnut-dark">
                          {address.address_type}
                        </span>
                      </p>
                      <p className="mt-1 text-brand-ink/70">
                        {[address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-brand-ink/70">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="mt-1 text-xs text-brand-ink/50">Phone: {address.phone}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {showAddressForm && (
              <div className="mt-4">
                <AddressForm
                  defaults={{ full_name: user?.name ?? "", phone: user?.phone ?? "", is_default: addresses.length === 0 }}
                  isSaving={saveAddress.isPending}
                  error={saveAddress.error ? errorText(saveAddress.error) : null}
                  onSubmit={(input) => saveAddress.mutate(input)}
                  onCancel={addresses.length > 0 ? () => setIsAddingAddress(false) : undefined}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-brand-sand-dark bg-white p-5">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-brand-ink">Delivery instructions (optional)</span>
              <textarea
                rows={2}
                maxLength={255}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Please call before delivery"
                className="w-full resize-none rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
              />
            </label>
          </section>
        </div>

        <SummaryCard
          lines={cartItems.map((item) => ({
            key: item.lineId,
            name: item.productName,
            variant: item.variantLabel,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
            image: item.image,
          }))}
          subtotal={cartSubtotal}
          total={cartSubtotal}
          savings={cartMrpTotal - cartSubtotal}
        >
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={isBusy || showAddressForm || selectedAddressId == null}
            onClick={handlePlaceOrder}
          >
            <ShieldCheck size={18} /> {busyLabel[status] ?? `Place Order & Pay ${formatInr(cartSubtotal)}`}
          </Button>
          {showAddressForm && <p className="mt-2 text-center text-xs text-brand-ink/50">Save a delivery address to continue.</p>}
          <Messages notice={notice} error={error} />
        </SummaryCard>
      </div>
    </Container>
  );
}

function DeliverTo({ address }: { address: { name: string; phone: string; address_line1: string; address_line2: string | null; landmark: string | null; city: string; state: string; pincode: string } }) {
  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5 text-sm">
      <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-brand-forest">
        <MapPin size={18} /> Delivering To
      </h3>
      <p className="mt-3 font-semibold text-brand-ink">{address.name}</p>
      <p className="text-brand-ink/70">{[address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ")}</p>
      <p className="text-brand-ink/70">
        {address.city}, {address.state} {address.pincode}
      </p>
      <p className="mt-1 text-xs text-brand-ink/50">Phone: {address.phone}</p>
    </div>
  );
}

interface SummaryLine {
  key: string;
  name: string;
  variant: string;
  quantity: number;
  total: number;
  image: string;
}

function SummaryCard({
  lines,
  subtotal,
  total,
  savings = 0,
  children,
}: {
  lines: SummaryLine[];
  subtotal: number;
  total: number;
  savings?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="h-fit rounded-2xl border border-brand-sand-dark bg-white p-5 lg:sticky lg:top-28">
      <h3 className="font-serif text-lg font-semibold text-brand-forest">Order Summary</h3>
      <ul className="mt-4 space-y-3">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center gap-3 text-sm">
            <ProductImagePlaceholder
              src={line.image || undefined}
              alt={line.name}
              gradient={PLACEHOLDER_GRADIENT}
              iconSize={16}
              sizes="48px"
              className="h-12 w-12 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brand-ink">{line.name}</p>
              <p className="text-xs text-brand-ink/60">
                {line.variant} × {line.quantity}
              </p>
            </div>
            <span className="font-semibold text-brand-forest">{formatInr(line.total)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 border-t border-brand-sand-dark pt-4 text-sm">
        <div className="flex justify-between text-brand-ink/70">
          <span>Subtotal</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-brand-ink/70">
            <span>You Save</span>
            <span className="text-green-700">-{formatInr(savings)}</span>
          </div>
        )}
        <div className="flex justify-between text-brand-ink/70">
          <span>Delivery</span>
          <span className="text-green-700">Free</span>
        </div>
        <div className="flex justify-between border-t border-brand-sand-dark pt-2 text-base font-semibold text-brand-ink">
          <span>Total</span>
          <span>{formatInr(total)}</span>
        </div>
      </div>
      {children}
      <p className="mt-3 text-center text-xs text-brand-ink/50">Secure payment by Razorpay · UPI, cards, net banking &amp; wallets</p>
    </div>
  );
}

function Messages({ notice, error }: { notice: string | null; error: string | null }) {
  return (
    <>
      {notice && <p className="mt-3 rounded-lg bg-brand-sand px-3 py-2 text-sm text-brand-ink/80">{notice}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
}
