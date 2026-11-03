"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getActivitySession, type ActivityEvent } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { Card, PageHeader, StatusPill, formatDateTime, humanize } from "@/components/admin/ui";
import { describeEvent, mediumLabel, pageLabel, sourceLabel } from "@/components/admin/activity/labels";

const REFRESH_MS = 15 * 1000;

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-brand-ink/55">{label}</dt>
      <dd className="min-w-0 break-words text-right text-brand-ink">{value}</dd>
    </div>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  const description = describeEvent(event.event_type, event.label, event.product_slug, event.path);
  return (
    <li className="relative border-l-2 border-brand-sand-dark pb-5 pl-5 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-forest" />
      <p className="text-sm font-medium text-brand-ink">
        {event.product_slug ? (
          <Link href={`/products/${event.product_slug}`} target="_blank" className="hover:underline">
            {description}
          </Link>
        ) : (
          description
        )}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-ink/60">
        <span>{formatDateTime(event.created_at)}</span>
        {event.variant && <span>· {event.variant}</span>}
        {event.quantity != null && <span>· Qty {event.quantity}</span>}
        {event.value != null && <span>· {formatInr(event.value)}</span>}
        {event.order_number && (
          <Link href={`/admin/orders/${encodeURIComponent(event.order_number)}`} className="font-semibold text-brand-forest underline">
            {event.order_number}
          </Link>
        )}
        {event.event_type === "order_placed" && event.payment_status && <StatusPill status={event.payment_status} />}
      </p>
    </li>
  );
}

export default function AdminActivityVisitPage() {
  const { id } = useParams<{ id: string }>();
  const { data: visit, isLoading, isError } = useQuery({
    queryKey: ["admin", "activity-session", id],
    queryFn: () => getActivitySession(id),
    refetchInterval: REFRESH_MS,
  });

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-white" />;
  if (isError || !visit) {
    return (
      <p className="text-sm text-red-600">
        Visit not found. <Link href="/admin/activity" className="underline">Back to user activity</Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/activity" className="inline-flex items-center gap-1 text-sm text-brand-ink/60 hover:text-brand-forest">
        <ArrowLeft size={14} /> User Activity
      </Link>
      <PageHeader
        title={visit.customer?.name ?? `Guest #${visit.id}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {visit.is_live && <StatusPill status="active" label="On the site now" />}
            Came from {sourceLabel(visit.source)}
            {mediumLabel(visit.medium) && ` (${mediumLabel(visit.medium)})`} · {visit.page_views} {visit.page_views === 1 ? "page" : "pages"}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="What they did" className="xl:col-span-2">
          {visit.events.length === 0 ? (
            <p className="text-sm text-brand-ink/60">No activity recorded.</p>
          ) : (
            <ul>
              {visit.events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Visit details">
            <dl className="divide-y divide-brand-sand-dark/60">
              {visit.customer && (
                <div className="flex justify-between gap-4 py-1.5 text-sm">
                  <dt className="text-brand-ink/55">Customer</dt>
                  <dd>
                    <Link href={`/admin/customers/${visit.customer.id}`} className="font-medium text-brand-forest hover:underline">
                      {visit.customer.name}
                    </Link>
                  </dd>
                </div>
              )}
              <Detail label="Phone" value={visit.customer?.phone} />
              <Detail label="Source" value={sourceLabel(visit.source)} />
              <Detail label="Type" value={mediumLabel(visit.medium)} />
              <Detail label="Campaign" value={visit.campaign} />
              <Detail label="Ad or post" value={visit.utm_content} />
              <Detail label="Keyword" value={visit.utm_term} />
              <Detail label="Came through" value={visit.referrer} />
              <Detail label="First page" value={pageLabel(visit.landing_path)} />
              <Detail label="Device" value={[visit.device_type && humanize(visit.device_type), visit.os].filter(Boolean).join(" · ")} />
              <Detail label="Browser" value={visit.browser} />
              <Detail label="Started" value={formatDateTime(visit.started_at)} />
              <Detail label="Last seen" value={formatDateTime(visit.last_seen_at)} />
            </dl>
          </Card>

          {visit.other_visits.length > 0 && (
            <Card title="Their other visits">
              <ul className="space-y-2 text-sm">
                {visit.other_visits.map((other) => (
                  <li key={other.id} className="flex justify-between gap-3">
                    <Link href={`/admin/activity/${other.id}`} className="font-medium text-brand-forest hover:underline">
                      {sourceLabel(other.source)}
                    </Link>
                    <span className="text-xs text-brand-ink/60">
                      {formatDateTime(other.started_at)} · {other.page_views} {other.page_views === 1 ? "page" : "pages"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
