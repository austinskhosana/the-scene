import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "@/components/lime/styles.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { LimePortalProvider } from "@/lib/lime/portal";
import { SceneClerkProvider } from "@/components/auth/clerk-provider";

const geist = GeistSans;


export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-product.png`;

  return {
    title: "The Scene — Build a human replying habit",
    description: "Track the replies you write yourself, show up consistently on X, and build genuine relationships without bots.",
    openGraph: {
      title: "The Scene — Build a human replying habit",
      description: "Show up consistently on X and build genuine relationships without bots.",
      type: "website",
      images: [{ url: imageUrl, width: 1670, height: 941, alt: "The Scene — Do the work. Let the results compound." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "The Scene — Build a human replying habit",
      description: "Show up consistently on X and build genuine relationships without bots.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="lime">
        <SceneClerkProvider>
          <LimePortalProvider>{children}</LimePortalProvider>
        </SceneClerkProvider>
      </body>
    </html>
  );
}
