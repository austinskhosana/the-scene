"use client";

import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { sceneUserProfileAppearance } from "@/components/auth/clerk-appearance";

export function SceneClerkProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{ theme: shadcn, userProfile: sceneUserProfileAppearance }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
