"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ElementType, useState } from "react";
// The onboarding cards intentionally use Heroicons at the product owner's request.
/* eslint-disable lime/no-second-icon-set */
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
/* eslint-enable lime/no-second-icon-set */
import { Button, buttonVariants } from "@/components/lime/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/lime/ui/card";
import { Progress } from "@/components/lime/ui/progress";
import { RadioChoice, RadioGroup } from "@/components/lime/ui/radio";
import { ArrowLeft, ArrowRight, CircleDash, Icon, Add, Subtract } from "@/components/lime/icon";
import { cn } from "@/lib/lime/utils";

const PURPOSES = [
  { value: "audience", label: "Build an audience", description: "Reach more of the right people.", icon: MegaphoneIcon },
  { value: "people", label: "Meet interesting people", description: "Turn replies into genuine relationships.", icon: UserGroupIcon },
  { value: "business", label: "Grow my business", description: "Build trust around what I offer.", icon: ChartBarIcon },
  { value: "building", label: "Share what I’m working on", description: "Show up consistently while I build.", icon: WrenchScrewdriverIcon },
] as const;

const ROLES = [
  { value: "creator", label: "Creator", description: "I publish ideas, stories, or educational content.", icon: PencilSquareIcon },
  { value: "founder", label: "Founder", description: "I’m building a company, product, or service.", icon: BuildingOffice2Icon },
  { value: "both", label: "Both", description: "I’m building a business and an audience.", icon: Squares2X2Icon },
  { value: "exploring", label: "I’m exploring", description: "I’m still finding my lane on X.", icon: MagnifyingGlassIcon },
] as const;

const TOTAL_STEPS = 3;
const DASHBOARD_STORAGE_KEY = "launchpad-state-v5";

function Choice({
  value,
  label,
  description,
  selected,
  icon,
}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  icon: ElementType;
}) {
  return <RadioChoice value={value} label={label} description={description} selected={selected} icon={icon} />;
}

function GoalStepper({
  label,
  description,
  value,
  min,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <Card variant="surface">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="font-normal">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="text-2xl font-normal tabular-nums text-fg">{value}</span>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label={`Decrease ${label.toLowerCase()}`}
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            <Icon icon={Subtract} size={16} />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="primary"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => onChange(value + 1)}
          >
            <Icon icon={Add} size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [role, setRole] = useState("");
  const [replyTarget, setReplyTarget] = useState(10);
  const [postTarget, setPostTarget] = useState(1);

  const canContinue = step === 1 ? Boolean(purpose) : step === 2 ? Boolean(role) : true;

  const finish = () => {
    window.localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({
        goals: { replies: 0, posts: 0 },
        targets: { replies: replyTarget, posts: postTarget },
        dark: false,
      }),
    );
    window.localStorage.setItem(
      "scene-onboarding-draft",
      JSON.stringify({ purpose, role, replyTarget, postTarget, completedAt: new Date().toISOString() }),
    );
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-dvh flex-col bg-page text-fg">
      <header className="mx-auto! flex h-16 w-full max-w-3xl shrink-0 items-center justify-between px-4 sm:px-6">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2 font-normal")}>
          <Icon icon={CircleDash} size={20} />
          <span>The Scene</span>
        </Link>
        <span className="text-sm tabular-nums text-fg-3">Step {step} of {TOTAL_STEPS}</span>
      </header>

      <div className="relative mx-auto! flex w-full max-w-xl flex-1 flex-col px-4 sm:px-6">
        <div className="absolute inset-x-4 top-32 sm:inset-x-6 sm:top-36">
          <Progress
            value={step}
            max={TOTAL_STEPS}
            label="Onboarding progress"
            valueText={`Step ${step} of ${TOTAL_STEPS}`}
          />
        </div>

        <div className="absolute inset-x-4 top-48 sm:inset-x-6">
          <div className="flex flex-col gap-4">

          {step === 1 && (
            <section aria-labelledby="purpose-title" className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 id="purpose-title" className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">What brings you to X?</h1>
                <p className="text-base text-fg-2">Choose the outcome that matters most right now.</p>
              </div>
              <RadioGroup
                value={purpose}
                onValueChange={(value) => setPurpose(value)}
                aria-labelledby="purpose-title"
              >
                {PURPOSES.map((option) => (
                  <Choice
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    selected={purpose === option.value}
                    icon={option.icon}
                  />
                ))}
              </RadioGroup>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="role-title" className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 id="role-title" className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">Which best describes you?</h1>
                <p className="text-base text-fg-2">This helps us shape the experience around your work.</p>
              </div>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value)}
                aria-labelledby="role-title"
              >
                {ROLES.map((option) => (
                  <Choice
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    selected={role === option.value}
                    icon={option.icon}
                  />
                ))}
              </RadioGroup>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="goals-title" className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 id="goals-title" className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">Set your daily goals</h1>
                <p className="text-base text-fg-2">Complete both goals to build your streak. You can change these later.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <GoalStepper
                  label="Replies"
                  description="Thoughtful replies each day."
                  value={replyTarget}
                  min={1}
                  onChange={setReplyTarget}
                />
                <GoalStepper
                  label="Original posts"
                  description="New posts each day."
                  value={postTarget}
                  min={0}
                  onChange={setPostTarget}
                />
              </div>
            </section>
          )}

            <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
                  <Icon icon={ArrowLeft} size={16} />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!canContinue}
                onClick={() => step < TOTAL_STEPS ? setStep((current) => current + 1) : finish()}
              >
                {step === TOTAL_STEPS ? "Start my streak" : "Continue"}
                <Icon icon={ArrowRight} size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
