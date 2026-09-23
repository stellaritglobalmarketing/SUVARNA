"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthSession } from "@/types/auth";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/Button";

export function SignupForm({ onSuccess, title = "Create your account" }: { onSuccess?: (session: AuthSession) => void; title?: string }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await signup({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
      onSuccess?.(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {title && <h2 className="font-serif text-xl font-semibold text-brand-forest">{title}</h2>}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-brand-ink">Full Name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-brand-ink">Phone</span>
        <input
          type="tel"
          required
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
          placeholder="9876543210"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-brand-ink">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-brand-ink">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
        <span className="text-xs text-brand-ink/50">
          Min 8 characters with an uppercase letter, a lowercase letter, a number &amp; a special character.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        <UserPlus size={16} /> {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
