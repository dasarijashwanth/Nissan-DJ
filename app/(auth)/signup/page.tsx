"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-text-primary">Create an account</h1>
      <p className="mb-6 text-sm text-text-muted">Start tracking your income, expenses, and car costs.</p>

      <GoogleSignInButton />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/[0.08]" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-black/[0.08]" />
      </div>

      <form action={formAction} className="space-y-4">
        <Input label="Email" id="email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <Input
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <Button type="submit" className="w-full" loading={pending}>
          Sign up
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Log in
        </Link>
      </p>
    </Card>
  );
}
