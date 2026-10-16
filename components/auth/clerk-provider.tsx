"use client";

import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";

export function SceneClerkProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const proxyUrl =
    typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")
      ? "/__clerk"
      : undefined;

  return (
    <ClerkProvider
      appearance={{ theme: shadcn }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      proxyUrl={proxyUrl}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
