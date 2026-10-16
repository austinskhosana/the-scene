"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CircleDash, Icon } from "@/components/lime/icon";
import { buttonVariants } from "@/components/lime/ui/button";
import { cn } from "@/lib/lime/utils";

type LegalSection = Readonly<{
  title: string;
  content: ReactNode;
}>;

type LegalPageProps = Readonly<{
  title: string;
  description: string;
  sections: readonly LegalSection[];
  relatedHref: string;
  relatedLabel: string;
}>;

export function LegalPage({ title, description, sections, relatedHref, relatedLabel }: LegalPageProps) {
  return (
    <div className="lime min-h-dvh bg-page text-fg">
      <main className="mx-auto! w-full max-w-2xl px-4 pb-8 sm:px-6">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-page">
          <Link
            href="/"
            aria-label="Back to The Scene"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Icon icon={ArrowLeft} size={20} />
          </Link>
          <h1 className="font-pixel-square text-xl leading-tight font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
        </header>

        <div className="flex flex-col gap-8 pt-8 sm:pt-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-fg-2">
              <Icon icon={CircleDash} size={20} />
              <span>The Scene</span>
            </div>
            <p className="max-w-xl text-base leading-normal text-fg-2">{description}</p>
            <p className="text-sm text-fg-3">
              Effective <time dateTime="2026-10-16">October 16, 2026</time>
            </p>
          </div>

          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="flex flex-col gap-3 text-sm leading-normal text-fg-2">{section.content}</div>
            </section>
          ))}

          <footer className="flex flex-col items-start gap-4 border-t border-line pt-6">
            <Link href={relatedHref} className={buttonVariants({ variant: "link", size: "sm" })}>
              {relatedLabel}
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto")}>
              Return to The Scene
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
