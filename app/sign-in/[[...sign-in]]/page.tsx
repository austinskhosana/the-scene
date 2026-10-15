"use client";

import { SignIn } from "@clerk/react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { sceneAuthAppearance } from "@/components/auth/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthPageShell title="Sign in to start your streak" description="Set your reply goal and start showing up consistently on X.">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/onboarding"
        signUpUrl="/sign-up"
        appearance={sceneAuthAppearance}
      />
    </AuthPageShell>
  );
}
