"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <Card className="p-6">
      <h1 className="mb-1 text-lg font-semibold text-text-primary">Welcome back</h1>
      <p className="mb-6 text-sm text-text-muted">Log in to your DJ Ledger account.</p>

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

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
