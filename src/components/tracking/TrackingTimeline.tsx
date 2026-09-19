import { Check, X } from "lucide-react";
import type { TrackingStage } from "@/types/order";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function TrackingTimeline({ stages }: { stages: TrackingStage[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-brand-sand-dark">
      {stages.map((stage, index) => (
        <li key={stage.key} className="relative pb-8 pl-8 last:pb-0">
          <span
            className={cn(
              "absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2",
              stage.status === "completed" && "border-brand-forest bg-brand-forest text-brand-sand",
              stage.status === "current" && "border-brand-gold bg-brand-gold text-brand-ink animate-pulse",
              stage.status === "pending" && "border-brand-sand-dark bg-white",
              stage.status === "failed" && "border-red-600 bg-red-600 text-white",
            )}
            aria-hidden="true"
          >
            {stage.status === "completed" && <Check size={12} />}
            {stage.status === "failed" && <X size={12} />}
          </span>
          <p
            className={cn(
              "text-sm font-semibold",
              stage.status === "pending" ? "text-brand-ink/40" : "text-brand-ink",
            )}
          >
            Stage {index + 1}: {stage.label}
          </p>
          <p className="mt-0.5 text-xs text-brand-ink/60">{stage.description}</p>
          {stage.timestamp && (
            <p className="mt-1 text-xs text-brand-ink/50">
              {formatDate(stage.timestamp)}
              {stage.location && ` · ${stage.location}`}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
