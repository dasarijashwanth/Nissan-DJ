"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const oauthError = useSearchParams().get("error");

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-text-primary">Welcome back</h1>
      <p className="mb-6 text-sm text-text-muted">Log in to your DJ account.</p>

      <GoogleSignInButton />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/[0.08]" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-black/[0.08]" />
      </div>

      {oauthError && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{oauthError}</p>}

      <form action={formAction} className="space-y-4">
        <Input label="Email" id="email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <Button type="submit" className="w-full" loading={pending}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
