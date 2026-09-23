"use client";

import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthSession } from "@/types/auth";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/Button";

export function LoginForm({ onSuccess, title = "Welcome back" }: { onSuccess?: (session: AuthSession) => void; title?: string }) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await login({ login: loginId.trim(), password });
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
        <span className="font-medium text-brand-ink">Email or Phone</span>
        <input
          type="text"
          required
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          placeholder="you@example.com or 9876543210"
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
          placeholder="••••••••"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        <LogIn size={16} /> {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
