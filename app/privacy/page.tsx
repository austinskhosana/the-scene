import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy | The Scene",
  description: "How The Scene collects, uses, and protects account and habit-tracking information.",
};

const sections = [
  {
    title: "Information we collect",
    content: (
      <>
        <p>We collect information needed to provide your account and habit tracker:</p>
        <ul className="flex list-disc flex-col gap-2 ps-5">
          <li>Account information such as your email address, display name, profile image, and connected X account details when available.</li>
          <li>Onboarding choices, daily reply and post goals, activity counts, completed days, and streak history.</li>
          <li>Session cookies, browser storage, and basic request information needed to keep you signed in, preserve drafts, prevent abuse, and diagnose failures.</li>
        </ul>
      </>
    ),
  },
  {
    title: "How we use information",
    content: (
      <p>
        We use this information to create and secure your account, save your preferences and progress, calculate streaks, restore your dashboard across sessions, and maintain The Scene.
      </p>
    ),
  },
  {
    title: "Services that process information",
    content: (
      <>
        <p>The Scene relies on service providers to operate:</p>
        <ul className="flex list-disc flex-col gap-2 ps-5">
          <li>Clerk provides authentication and account management.</li>
          <li>Supabase stores profile, onboarding, goal, activity, and streak records.</li>
          <li>Vercel hosts the production application and may process request logs.</li>
          <li>X provides social sign-in when you choose to connect your X account.</li>
        </ul>
        <p>Each provider processes information under its own terms and privacy policy. We do not sell your personal information.</p>
      </>
    ),
  },
  {
    title: "Cookies and browser storage",
    content: (
      <p>
        Authentication cookies keep your session active and protect signed-in routes. Browser storage may hold a local onboarding draft and dashboard values as a fallback. Blocking or clearing this storage can sign you out or remove unsaved local information.
      </p>
    ),
  },
  {
    title: "Retention and your choices",
    content: (
      <p>
        We retain account and habit data while it is needed to provide The Scene. You can update your profile or delete your authentication account from the account page. To ask about access, correction, or deletion of associated application records, contact the project maintainer through the repository and do not include sensitive information in a public issue.
      </p>
    ),
  },
  {
    title: "Security",
    content: (
      <p>
        We use access controls and server-side credentials intended to limit access to stored information. No online service can guarantee absolute security, so please use a strong password and protect access to your connected accounts.
      </p>
    ),
  },
  {
    title: "Contact and changes",
    content: (
      <p>
        Questions about this policy can be raised through the{" "}
        <Link className="text-fg underline underline-offset-4" href="https://github.com/austinskhosana/the-scene" target="_blank" rel="noreferrer">
          The Scene repository
        </Link>
        . We may update this policy as the product changes and will revise the effective date on this page.
      </p>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="This policy explains what information The Scene handles and how it is used when you create an account and track your activity."
      sections={sections}
      relatedHref="/terms"
      relatedLabel="Read the terms of service"
    />
  );
}
