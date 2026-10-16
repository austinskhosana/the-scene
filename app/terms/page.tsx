import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of service | The Scene",
  description: "The terms that apply when using The Scene.",
};

const sections = [
  {
    title: "Using The Scene",
    content: (
      <p>
        The Scene is a habit tracker for recording replies and original posts. You may use it only if you can legally agree to these terms and your use complies with the laws and platform rules that apply to you.
      </p>
    ),
  },
  {
    title: "Your account",
    content: (
      <p>
        You are responsible for the accuracy of the information connected to your account and for keeping your sign-in credentials secure. Tell us through the project repository if you believe your account has been compromised.
      </p>
    ),
  },
  {
    title: "Acceptable use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="flex list-disc flex-col gap-2 ps-5">
          <li>Use The Scene to break the law, harass others, or violate another person&apos;s rights.</li>
          <li>Attempt to bypass access controls, disrupt the service, or access another person&apos;s account or data.</li>
          <li>Use the service in a way that violates X&apos;s rules or the terms of another connected service.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Your activity and connected services",
    content: (
      <p>
        You remain responsible for the replies, posts, and other activity you perform on X. The Scene records goals and counts but does not act as X, control X, or guarantee account growth, engagement, or any other result. X, Clerk, Supabase, Vercel, and other third-party services have their own terms.
      </p>
    ),
  },
  {
    title: "Availability and changes",
    content: (
      <p>
        The Scene may change, pause, or stop features as the project develops. We aim to preserve your saved progress, but the service is provided without a promise that it will always be available, uninterrupted, or error-free.
      </p>
    ),
  },
  {
    title: "Disclaimers and responsibility",
    content: (
      <p>
        To the extent permitted by law, The Scene is provided as available without warranties. The project maintainer is not responsible for indirect, incidental, or consequential losses arising from your use of the service or from third-party platforms.
      </p>
    ),
  },
  {
    title: "Ending use",
    content: (
      <p>
        You can stop using The Scene at any time and delete your authentication account from the account page. We may restrict access when reasonably necessary to protect the service, other users, or comply with legal obligations.
      </p>
    ),
  },
  {
    title: "Contact and changes",
    content: (
      <p>
        Questions about these terms can be raised through the{" "}
        <Link className="text-fg underline underline-offset-4" href="https://github.com/austinskhosana/the-scene" target="_blank" rel="noreferrer">
          The Scene repository
        </Link>
        . We may update these terms as the service changes and will revise the effective date on this page.
      </p>
    ),
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      description="These terms describe the rules for using The Scene and the responsibilities that remain with you."
      sections={sections}
      relatedHref="/privacy"
      relatedLabel="Read the privacy policy"
    />
  );
}
