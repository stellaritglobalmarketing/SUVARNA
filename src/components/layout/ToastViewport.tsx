"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { dismissToast, selectToasts, type Toast } from "@/lib/redux/slices/uiSlice";
import { cn } from "@/lib/utils/cn";

const TONE_ICON: Record<Toast["tone"], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<Toast["tone"], string> = {
  success: "border-brand-forest/30 text-brand-forest",
  error: "border-red-300 text-red-700",
  info: "border-brand-sand-dark text-brand-ink",
};

export function ToastViewport() {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  return (
    <div className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 lg:bottom-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dispatch(dismissToast(toast.id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = TONE_ICON[toast.tone];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-lg",
        TONE_CLASSES[toast.tone],
      )}
    >
      <Icon size={16} className="shrink-0" />
      {toast.message}
    </div>
  );
}
