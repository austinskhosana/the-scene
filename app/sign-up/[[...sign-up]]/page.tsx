"use client";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthPageShell title="Create your account" description="Set your reply goal and start showing up consistently on X.">
      <SignUpForm />
    </AuthPageShell>
  );
}
