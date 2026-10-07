import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Launchpad — Daily distribution, compounded",
    description: "A calm operating system for showing up, doing the work, and letting distribution compound.",
    openGraph: {
      title: "Launchpad — Daily distribution, compounded",
      description: "Do the work. Let the results compound.",
      type: "website",
      images: [{ url: imageUrl, width: 1670, height: 941, alt: "Launchpad — Do the work. Let the results compound." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Launchpad — Daily distribution, compounded",
      description: "Do the work. Let the results compound.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
