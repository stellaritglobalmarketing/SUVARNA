"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useAdoptSession, useAuth } from "@/hooks/useAuth";
import { setPassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";

/** For an account made at guest checkout, which has no password until the customer sets one here. Hidden for everyone else. */
export function SetPasswordCard({ className }: { className?: string }) {
  const { user, token } = useAuth();
  const adoptSession = useAdoptSession();
  const [password, setValue] = useState("");
  const save = useMutation({
    mutationFn: () => setPassword(password),
    onSuccess: () => {
      if (user && token) adoptSession({ token, user: { ...user, has_password: true } });
    },
  });

  if (user?.has_password !== false) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-brand-sand-dark bg-white p-5 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-brand-forest">
        <KeyRound size={18} /> Set a password
      </h2>
      <p className="mt-1 text-sm text-brand-ink/70">
        You&apos;re signed in on this device. Set a password to log in with {user.phone} on any other device and see your orders.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          required
          type="password"
          autoComplete="new-password"
          aria-label="New password"
          value={password}
          onChange={(event) => setValue(event.target.value)}
          placeholder="New password"
          className="w-full rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
        <Button type="submit" disabled={save.isPending} className="shrink-0">
          {save.isPending ? "Saving…" : "Save Password"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-brand-ink/50">At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.</p>
      {save.isError && <p className="mt-2 text-sm text-red-600">{save.error.message}</p>}
    </form>
  );
}
