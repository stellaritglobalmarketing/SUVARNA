"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAppDispatch } from "@/lib/redux/hooks";
import { pushToast } from "@/lib/redux/slices/uiSlice";

function LoginPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  // Only same-site paths — never follow ?next= to another website.
  const rawNext = searchParams.get("next");
  const next = rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : null;

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-brand-sand-dark bg-white p-6 sm:p-8">
        <LoginForm
          onSuccess={(session) => {
            dispatch(pushToast(`Welcome back, ${session.user.name}!`, "success"));
            // Admins land on the admin panel unless they were sent here from a specific page.
            router.push(next || (session.user.role === "admin" ? "/admin" : "/"));
          }}
        />
        <p className="mt-5 text-center text-sm text-brand-ink/70">
          New to Suvarna7?{" "}
          <Link href="/signup" className="font-semibold text-brand-forest hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
