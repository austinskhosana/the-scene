"use client";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthPageShell title="Sign in to start your streak" description="Set your reply goal and start showing up consistently on X.">
      <SignInForm />
    </AuthPageShell>
  );
}
