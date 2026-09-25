"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createImage, deleteImage, setPrimaryImage, type AdminProduct } from "@/lib/api/admin";
import { AdminButton, Card, Checkbox, Field, ImageInput, confirmAction, inputClass, useAdminMutation } from "@/components/admin/ui";

type Refresh = { invalidate: unknown[][] };

/** Product photos: add by upload or URL, choose the primary (card) photo, remove. */
export function ImagesPanel({ product, refresh }: { product: AdminProduct; refresh: Refresh }) {
  const [url, setUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [alt, setAlt] = useState("");
  const [makePrimary, setMakePrimary] = useState(product.images.length === 0);

  const add = useAdminMutation(
    () =>
      createImage(product.id, {
        image_url: url.trim(),
        // Uploaded files carry a "local:…" id; pasted URLs are identified by the URL itself.
        cloudinary_public_id: publicId || `url:${url.trim()}`.slice(0, 255),
        alt_text: alt.trim() || product.name,
        is_primary: makePrimary ? 1 : 0,
        sort_order: product.images.length,
      }),
    {
      success: "Photo added",
      ...refresh,
      onSuccess: () => {
        setUrl("");
        setPublicId("");
        setAlt("");
        setMakePrimary(false);
      },
    },
  );
  const primary = useAdminMutation((id: number) => setPrimaryImage(id), { success: "Primary photo changed", ...refresh });
  const remove = useAdminMutation((id: number) => deleteImage(id), { success: "Photo removed", ...refresh });

  return (
    <div className="space-y-6">
      <Card title="Photos">
        {product.images.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No photos yet — the store shows a coloured placeholder until you add one.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.images.map((img) => (
              <li key={img.id} className="overflow-hidden rounded-xl border border-brand-sand-dark">
                <div className="relative aspect-square bg-brand-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL */}
                  <img src={img.image_url} alt={img.alt_text ?? ""} className="h-full w-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-gold px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                      <Star size={11} /> Primary
                    </span>
                  )}
                </div>
                <div className="flex gap-1 p-2">
                  {!img.is_primary && (
                    <AdminButton size="sm" variant="outline" disabled={primary.isPending} onClick={() => primary.mutate(img.id)} className="flex-1">
                      Make primary
                    </AdminButton>
                  )}
                  <AdminButton
                    size="sm"
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() => confirmAction("Remove this photo?") && remove.mutate(img.id)}
                    className="flex-1"
                  >
                    Remove
                  </AdminButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Add a photo">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) add.mutate(undefined);
          }}
          className="grid max-w-xl grid-cols-1 gap-3"
        >
          <Field label="Image" hint="Upload a JPEG/PNG/WebP (max 5 MB) or paste an image URL. Square photos look best.">
            <ImageInput
              value={url}
              onChange={(value) => {
                setUrl(value);
                setPublicId("");
              }}
              onUploaded={(upload) => setPublicId(upload.public_id)}
            />
          </Field>
          <Field label="Alt text" hint="Describes the photo for screen readers and search engines.">
            <input maxLength={160} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder={product.name} className={inputClass} />
          </Field>
          <Checkbox label="Use as the primary photo (shown on product cards)" checked={makePrimary} onChange={setMakePrimary} />
          <div>
            <AdminButton type="submit" disabled={!url.trim()} loading={add.isPending}>
              Add photo
            </AdminButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
