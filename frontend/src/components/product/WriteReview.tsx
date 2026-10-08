"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, PenLine, Star, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submitReview } from "@/lib/api/reviews";
import { Button } from "@/components/ui/Button";
import { LoginForm } from "@/components/auth/LoginForm";
import { cn } from "@/lib/utils/cn";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const TITLE_MAX = 128;
const TEXT_MAX = 1000;

const fieldClass =
  "w-full rounded-xl border border-brand-sand-dark bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-forest focus:outline-none";

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Your rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="p-0.5 cursor-pointer"
          >
            <Star
              size={28}
              strokeWidth={1.5}
              className={cn("transition-colors", star <= shown ? "fill-brand-gold text-brand-gold" : "text-brand-ink/25")}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-brand-ink/70">{RATING_WORDS[shown]}</span>
    </div>
  );
}

/** "Write a Review" button that opens an inline form (or a sign-in form first, for guests). */
export function WriteReview({ slug, productName }: { slug: string; productName: string }) {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [ratingError, setRatingError] = useState(false);

  const mutation = useMutation({
    mutationFn: () => submitReview(slug, { rating, title: title.trim() || undefined, review_text: text.trim() || undefined }),
  });

  const close = () => {
    setOpen(false);
    if (mutation.isSuccess) {
      setRating(0);
      setTitle("");
      setText("");
      mutation.reset();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    mutation.mutate();
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PenLine size={16} /> Write a Review
      </Button>
    );
  }

  return (
    <div className="animate-tab-in w-full rounded-2xl border border-brand-sand-dark bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-brand-forest">Review {productName}</h3>
          <p className="mt-0.5 text-sm text-brand-ink/60">Share what you liked, how you used it, and how it tasted.</p>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="rounded-full p-1.5 text-brand-ink/50 hover:bg-brand-sand hover:text-brand-ink cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {mutation.isSuccess ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <CircleCheck size={44} strokeWidth={1.5} className="text-green-700" />
          <p className="font-semibold text-brand-forest">Thank you for your review!</p>
          <p className="max-w-sm text-sm text-brand-ink/65">
            It will appear here once our team has approved it.
            {mutation.data.is_verified_purchase && " It will carry a Verified Buyer badge."}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={close}>
            Done
          </Button>
        </div>
      ) : !isAuthenticated ? (
        <div className="mt-5 max-w-sm">
          <p className="mb-4 text-sm text-brand-ink/70">Please sign in to write a review.</p>
          <LoginForm title="" />
          <p className="mt-4 text-sm text-brand-ink/65">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-brand-forest underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      ) : user?.role === "admin" ? (
        <p className="mt-5 text-sm text-brand-ink/70">You&apos;re signed in as an admin. Sign in with a customer account to write a review.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-brand-ink">Your rating</p>
            <StarPicker
              value={rating}
              onChange={(value) => {
                setRating(value);
                setRatingError(false);
              }}
            />
            {ratingError && <p className="mt-1 text-xs text-red-600">Please choose a star rating.</p>}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-brand-ink">
              Title <span className="font-normal text-brand-ink/50">(optional)</span>
            </span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} placeholder="Sum it up in a few words" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-sm font-medium text-brand-ink">
              <span>
                Your review <span className="font-normal text-brand-ink/50">(optional)</span>
              </span>
              <span className="font-normal tabular-nums text-brand-ink/40">
                {text.length}/{TEXT_MAX}
              </span>
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={TEXT_MAX}
              rows={4}
              placeholder="How was the taste, aroma and packaging?"
              className={cn(fieldClass, "resize-y")}
            />
          </label>
          {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting…" : "Submit Review"}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
