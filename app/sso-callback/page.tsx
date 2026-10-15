"use client";

import { HandleSSOCallback } from "@clerk/react";
import { useRouter } from "next/navigation";

export default function SsoCallbackPage() {
  const router = useRouter();
  const destination = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("destination") === "dashboard"
    ? "/dashboard"
    : "/onboarding";

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        const target = decorateUrl(destination);
        if (target.startsWith("http")) {
          window.location.assign(target);
          return;
        }
        router.push(target);
      }}
      navigateToSignIn={() => router.push("/sign-in")}
      navigateToSignUp={() => router.push("/sign-up")}
    />
  );
}
