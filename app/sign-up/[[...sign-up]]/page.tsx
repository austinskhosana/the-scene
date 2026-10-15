"use client";

import { SignUp } from "@clerk/react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { sceneAuthAppearance } from "@/components/auth/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthPageShell title="Create your account" description="Set your reply goal and start showing up consistently on X.">
      <SignUp
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
        appearance={sceneAuthAppearance}
      />
    </AuthPageShell>
  );
}
