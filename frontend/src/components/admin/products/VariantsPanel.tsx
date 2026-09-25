"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  WEIGHT_UNITS,
  createVariant,
  deleteVariant,
  setInventory,
  setVariantStatus,
  updateVariant,
  type AdminProduct,
  type AdminVariant,
  type VariantInput,
} from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { ActivePill, AdminButton, Checkbox, Field, Modal, StatusPill, Table, confirmAction, inputClass, useAdminMutation } from "@/components/admin/ui";

type Refresh = { invalidate: unknown[][] };

function VariantModal({ productId, variant, onClose, refresh }: { productId: number; variant: AdminVariant | null; onClose: () => void; refresh: Refresh }) {
  const [values, setValues] = useState<VariantInput>({
    variant_name: variant?.variant_name ?? "",
    weight_value: variant?.weight_value ?? "",
    weight_unit: variant?.weight_unit ?? "g",
    sku: variant?.sku ?? "",
    mrp: variant?.mrp ?? "",
    selling_price: variant?.selling_price ?? "",
    is_default: variant?.is_default ? 1 : 0,
  });
  const set = <K extends keyof VariantInput>(key: K, value: VariantInput[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = useAdminMutation(
    (body: VariantInput) => (variant ? updateVariant(variant.id, body) : createVariant(productId, body)),
    { success: variant ? "Variant updated" : "Variant added — set its stock next", ...refresh, onSuccess: onClose },
  );

  const discount =
    Number(values.mrp) > 0 && Number(values.selling_price) > 0 && Number(values.selling_price) < Number(values.mrp)
      ? Math.round(((Number(values.mrp) - Number(values.selling_price)) / Number(values.mrp)) * 100)
      : 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({
      ...values,
      weight_value: values.weight_value === "" ? undefined : Number(values.weight_value),
      mrp: Number(values.mrp),
      selling_price: Number(values.selling_price),
    });
  };

  return (
    <Modal title={variant ? `Edit ${variant.variant_name}` : "Add variant"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <Field label="Pack label *" hint='Shown to customers, e.g. "250g", "1L"' className="col-span-2">
          <input required maxLength={64} value={values.variant_name} onChange={(e) => set("variant_name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Weight">
          <input type="number" min={0} step="any" value={values.weight_value} onChange={(e) => set("weight_value", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Unit">
          <select value={values.weight_unit} onChange={(e) => set("weight_unit", e.target.value)} className={inputClass}>
            {WEIGHT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="MRP (₹) *">
          <input required type="number" min={0} step="0.01" value={values.mrp} onChange={(e) => set("mrp", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Selling price (₹) *" hint={discount ? `${discount}% off` : undefined}>
          <input required type="number" min={0} step="0.01" value={values.selling_price} onChange={(e) => set("selling_price", e.target.value)} className={inputClass} />
        </Field>
        <Field label="SKU *" hint="Unique code, e.g. ALM-MAM-250" className="col-span-2">
          <input required maxLength={64} value={values.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className={inputClass} />
        </Field>
        <div className="col-span-2">
          <Checkbox label="Default pack (selected first on the product page)" checked={!!values.is_default} onChange={(c) => set("is_default", c ? 1 : 0)} />
        </div>
        <div className="col-span-2 flex gap-2">
          <AdminButton type="submit" loading={save.isPending}>
            {variant ? "Save" : "Add variant"}
          </AdminButton>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

function StockModal({ variant, onClose, refresh }: { variant: AdminVariant; onClose: () => void; refresh: Refresh }) {
  const [stock, setStock] = useState(String(variant.stock_quantity));
  const [lowLimit, setLowLimit] = useState(String(variant.low_stock_limit));
  const save = useAdminMutation(
    () => setInventory(variant.id, { stock_quantity: Number(stock), low_stock_limit: Number(lowLimit) }),
    { success: "Stock updated", ...refresh, onSuccess: onClose },
  );
  return (
    <Modal title={`Stock — ${variant.variant_name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined);
        }}
        className="space-y-3"
      >
        <p className="text-sm text-brand-ink/70">
          {variant.reserved_quantity > 0
            ? `${variant.reserved_quantity} unit(s) are held by unpaid/unshipped orders, so stock can't go below that.`
            : "No units are currently held by orders."}
        </p>
        <Field label="Units in stock (total)">
          <input required type="number" min={variant.reserved_quantity} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Low-stock alert at" hint="Shows up on the dashboard when available stock drops to this.">
          <input type="number" min={0} value={lowLimit} onChange={(e) => setLowLimit(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <AdminButton type="submit" loading={save.isPending}>
            Save stock
          </AdminButton>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

/** Pack sizes with their price and stock. */
export function VariantsPanel({ product, refresh }: { product: AdminProduct; refresh: Refresh }) {
  const [editing, setEditing] = useState<AdminVariant | "new" | null>(null);
  const [stockFor, setStockFor] = useState<AdminVariant | null>(null);

  const toggle = useAdminMutation(({ id, active }: { id: number; active: boolean }) => setVariantStatus(id, active), { success: "Variant updated", ...refresh });
  const remove = useAdminMutation((id: number) => deleteVariant(id), { success: "Variant deleted", ...refresh });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-ink/60">
          Each pack size is a variant with its own price, SKU and stock. Customers only see active variants.
        </p>
        <AdminButton onClick={() => setEditing("new")}>
          <Plus size={15} /> Add variant
        </AdminButton>
      </div>

      <Table head={["Pack", "SKU", "MRP", "Price", "Stock", "Status", ""]} minWidth={820}>
        {product.variants.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-10 text-center text-sm text-brand-ink/60">
              No variants yet — the product won&apos;t show on the store until it has at least one.
            </td>
          </tr>
        )}
        {product.variants.map((v) => (
          <tr key={v.id}>
            <td className="px-4 py-3 font-medium">
              {v.variant_name}
              {v.is_default && <span className="ml-2 text-xs text-brand-ink/50">(default)</span>}
            </td>
            <td className="px-4 py-3 text-brand-ink/70">{v.sku}</td>
            <td className="px-4 py-3 text-brand-ink/70">{formatInr(v.mrp)}</td>
            <td className="px-4 py-3 font-medium">{formatInr(v.selling_price)}</td>
            <td className="px-4 py-3">
              <button type="button" onClick={() => setStockFor(v)} className="text-left cursor-pointer">
                <span className={v.available_quantity === 0 ? "font-semibold text-red-600" : "font-medium text-brand-forest underline decoration-dotted"}>
                  {v.available_quantity} available
                </span>
                {v.reserved_quantity > 0 && <span className="block text-xs text-brand-ink/50">{v.reserved_quantity} held by orders</span>}
              </button>
              {v.available_quantity === 0 && <StatusPill status="low" label="Sold out" />}
            </td>
            <td className="px-4 py-3">
              <ActivePill active={v.is_active} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <AdminButton size="sm" variant="outline" onClick={() => setStockFor(v)}>
                  Stock
                </AdminButton>
                <AdminButton size="sm" variant="outline" onClick={() => setEditing(v)}>
                  Edit
                </AdminButton>
                <AdminButton size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: v.id, active: !v.is_active })}>
                  {v.is_active ? "Hide" : "Show"}
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="danger"
                  disabled={remove.isPending}
                  onClick={() => confirmAction(`Delete the ${v.variant_name} variant? Past orders keep their record.`) && remove.mutate(v.id)}
                >
                  Delete
                </AdminButton>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {editing && <VariantModal productId={product.id} variant={editing === "new" ? null : editing} onClose={() => setEditing(null)} refresh={refresh} />}
      {stockFor && <StockModal variant={stockFor} onClose={() => setStockFor(null)} refresh={refresh} />}
    </div>
  );
}
