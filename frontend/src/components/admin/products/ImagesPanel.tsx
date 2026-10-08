"use client";

import { useRef, useState } from "react";
import { Film, Star, Upload } from "lucide-react";
import {
  IMAGE_UPLOAD_TYPES,
  VIDEO_UPLOAD_TYPES,
  createImage,
  deleteImage,
  setPrimaryImage,
  uploadMedia,
  type AdminProduct,
  type MediaType,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils/cn";
import { AdminButton, Card, Checkbox, Field, confirmAction, errorText, inputClass, useAdminMutation } from "@/components/admin/ui";

type Refresh = { invalidate: unknown[][] };

/** Product photos and videos: upload several at once or add by URL, choose the primary (card) photo, remove. */
export function ImagesPanel({ product, refresh }: { product: AdminProduct; refresh: Refresh }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState<MediaType>("image");
  const [alt, setAlt] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);

  const hasPrimary = product.images.some((img) => img.is_primary && img.media_type === "image");

  // Uploads one file at a time so a large video doesn't compete with the rest, and so a bad
  // file only skips itself. The first photo becomes primary when the product has none yet.
  const bulk = useAdminMutation(
    async (files: File[]) => {
      const failed: string[] = [];
      let added = 0;
      let needsPrimary = !hasPrimary;
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        try {
          const upload = await uploadMedia(file);
          const isPrimary = upload.media_type === "image" && needsPrimary;
          await createImage(product.id, {
            image_url: upload.url,
            cloudinary_public_id: upload.public_id,
            media_type: upload.media_type,
            alt_text: product.name,
            is_primary: isPrimary ? 1 : 0,
            sort_order: product.images.length + index,
          });
          if (isPrimary) needsPrimary = false;
          added += 1;
        } catch (error) {
          failed.push(errorText(error));
        }
      }
      setFailures(failed);
      if (added === 0) throw new Error(failed[0] ?? "Upload failed.");
      return added;
    },
    {
      success: "Media added",
      ...refresh,
      onSuccess: () => setProgress(null),
    },
  );

  const add = useAdminMutation(
    () =>
      createImage(product.id, {
        image_url: url.trim(),
        // Pasted URLs are identified by the URL itself.
        cloudinary_public_id: `url:${url.trim()}`.slice(0, 255),
        media_type: urlType,
        alt_text: alt.trim() || product.name,
        is_primary: urlType === "image" && (makePrimary || !hasPrimary) ? 1 : 0,
        sort_order: product.images.length,
      }),
    {
      success: urlType === "video" ? "Video added" : "Photo added",
      ...refresh,
      onSuccess: () => {
        setUrl("");
        setAlt("");
        setMakePrimary(false);
      },
    },
  );
  const primary = useAdminMutation((id: number) => setPrimaryImage(id), { success: "Primary photo changed", ...refresh });
  const remove = useAdminMutation((id: number) => deleteImage(id), { success: "Removed", ...refresh });

  const startUpload = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (files.length === 0) return;
    setFailures([]);
    bulk.mutate(files, { onError: () => setProgress(null) });
  };

  return (
    <div className="space-y-6">
      <Card title={`Photos & Videos (${product.images.length})`}>
        {product.images.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No photos yet — the store shows a coloured placeholder until you add one.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.images.map((img) => (
              <li key={img.id} className="overflow-hidden rounded-xl border border-brand-sand-dark">
                <div className="relative aspect-square bg-brand-sand">
                  {img.media_type === "video" ? (
                    <video src={img.image_url} muted controls preload="metadata" className="h-full w-full bg-black object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
                    <img src={img.image_url} alt={img.alt_text ?? ""} className="h-full w-full object-cover" />
                  )}
                  {img.is_primary && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-gold px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                      <Star size={11} /> Primary
                    </span>
                  )}
                  {img.media_type === "video" && (
                    <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Film size={11} /> Video
                    </span>
                  )}
                </div>
                <div className="flex gap-1 p-2">
                  {!img.is_primary && img.media_type === "image" && (
                    <AdminButton size="sm" variant="outline" disabled={primary.isPending} onClick={() => primary.mutate(img.id)} className="flex-1">
                      Make primary
                    </AdminButton>
                  )}
                  <AdminButton
                    size="sm"
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() => confirmAction(`Remove this ${img.media_type === "video" ? "video" : "photo"}?`) && remove.mutate(img.id)}
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

      <Card title="Add photos & videos">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={[...IMAGE_UPLOAD_TYPES, ...VIDEO_UPLOAD_TYPES].join(",")}
          className="hidden"
          onChange={(e) => startUpload(e.target.files)}
        />
        <div
          role="button"
          tabIndex={0}
          aria-disabled={bulk.isPending}
          onClick={() => !bulk.isPending && fileRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !bulk.isPending) {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = bulk.isPending ? "none" : "copy";
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            // Ignore leaving into a child element of the drop zone.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!bulk.isPending) startUpload(e.dataTransfer.files);
          }}
          className={cn(
            "mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragging ? "border-brand-forest bg-brand-forest/5" : "border-brand-sand-dark hover:border-brand-forest/50",
            bulk.isPending && "cursor-wait opacity-60",
          )}
        >
          <Upload size={24} className="text-brand-forest" />
          <p className="text-sm font-medium text-brand-ink">
            {isDragging ? "Drop to upload" : "Drag & drop photos and videos here, or click to choose"}
          </p>
          <p className="text-xs text-brand-ink/60">
            Add as many as you like at once. Photos: JPEG/PNG/WebP, max 5 MB each (square looks best). Videos: MP4/WebM/MOV, max 50 MB
            each. Videos appear in the product page gallery after the photos.
          </p>
        </div>
        {progress && <p className="mb-4 text-sm font-medium text-brand-forest">{progress}</p>}
        {failures.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {failures.map((failure, index) => (
              <li key={index}>{failure}</li>
            ))}
          </ul>
        )}


        <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-brand-ink/45">
          <span className="h-px flex-1 bg-brand-sand-dark" /> or add by URL <span className="h-px flex-1 bg-brand-sand-dark" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) add.mutate(undefined);
          }}
          className="grid max-w-xl grid-cols-1 gap-3"
        >
          <Field label="Type">
            <select value={urlType} onChange={(e) => setUrlType(e.target.value as MediaType)} className={inputClass}>
              <option value="image">Photo</option>
              <option value="video">Video (direct .mp4 / .webm link)</option>
            </select>
          </Field>
          <Field label="URL" hint="Paste a direct link to the file. YouTube page links won't play here.">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={inputClass} />
          </Field>
          <Field label="Alt text" hint="Describes the photo or video for screen readers and search engines.">
            <input maxLength={160} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder={product.name} className={inputClass} />
          </Field>
          {urlType === "image" && hasPrimary && (
            <Checkbox label="Use as the primary photo (shown on product cards)" checked={makePrimary} onChange={setMakePrimary} />
          )}
          <div>
            <AdminButton type="submit" disabled={!url.trim()} loading={add.isPending}>
              Add {urlType === "video" ? "video" : "photo"}
            </AdminButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
