"use client";

import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";

export function SceneClerkProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const usesLiveClerkInstance = publishableKey?.startsWith("pk_live_") ?? false;
  const proxyUrl = process.env.NODE_ENV === "production" || usesLiveClerkInstance ? "/__clerk" : undefined;

  return (
    <ClerkProvider
      appearance={{ theme: shadcn }}
      publishableKey={publishableKey}
      proxyUrl={proxyUrl}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
