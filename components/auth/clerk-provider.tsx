"use client";

import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";

export function SceneClerkProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{ theme: shadcn }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
