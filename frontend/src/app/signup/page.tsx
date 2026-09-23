"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { SignupForm } from "@/components/auth/SignupForm";
import { useAppDispatch } from "@/lib/redux/hooks";
import { pushToast } from "@/lib/redux/slices/uiSlice";

function SignupPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-brand-sand-dark bg-white p-6 sm:p-8">
        <SignupForm
          onSuccess={(session) => {
            dispatch(pushToast(`Welcome to Harvesta, ${session.user.name}!`, "success"));
            router.push(next);
          }}
        />
        <p className="mt-5 text-center text-sm text-brand-ink/70">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-forest hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
