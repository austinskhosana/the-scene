"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountMenu } from "@/components/auth/account-menu";
import { Button, buttonVariants } from "@/components/lime/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/lime/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/lime/ui/field";
import { Input } from "@/components/lime/ui/input";
import { Progress } from "@/components/lime/ui/progress";
import { Switch } from "@/components/lime/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/lime/ui/tooltip";
import { Add, CircleDash, Icon, Moon, Settings, Subtract, Sun } from "@/components/lime/icon";
import { cn } from "@/lib/lime/utils";

type View = "Today" | "Settings";
type GoalKey = "replies" | "posts";
type Goals = Record<GoalKey, number>;
type Targets = Record<GoalKey, number>;

const INITIAL_GOALS: Goals = { replies: 0, posts: 0 };
const INITIAL_TARGETS: Targets = { replies: 100, posts: 1 };
const TODAY = "2026-10-07";
const STORAGE_KEY = "launchpad-state-v5";

const goalMeta: Record<GoalKey, { label: string; singular: string }> = {
  replies: { label: "Replies", singular: "reply" },
  posts: { label: "Original posts", singular: "original post" },
};

const contributionLevelClass = ["bg-surface-3", "bg-surface-3", "bg-surface-3", "bg-accent"];

function clampPercent(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

function buildContributionDays(goals: Goals, targets: Targets) {
  const start = new Date("2026-01-01T12:00:00Z");
  const end = new Date("2026-12-31T12:00:00Z");
  const result = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = cursor.toISOString().slice(0, 10);
    const future = iso > TODAY;
    let replies = 0;
    let posts = 0;

    if (iso === TODAY) {
      replies = goals.replies;
      posts = goals.posts;
    }

    const replyPercent = clampPercent(replies, targets.replies);
    const postPercent = clampPercent(posts, targets.posts);
    const percentage = Math.floor((replyPercent + postPercent) / 2);
    const complete = replies >= targets.replies && posts >= targets.posts;
    const level = complete ? 3 : 0;
    result.push({ iso, future, replies, posts, percentage, complete, level });
  }

  return result;
}

function GoalCard({
  goalKey,
  value,
  target,
  onChange,
}: {
  goalKey: GoalKey;
  value: number;
  target: number;
  onChange: (value: number) => void;
}) {
  const meta = goalMeta[goalKey];
  const percentage = clampPercent(value, target);
  const valueText = `${value} of ${target}`;

  return (
    <Card variant="surface">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="font-normal">{meta.label}</CardTitle>
          <CardDescription>{percentage === 100 ? "Goal reached" : `${target - value} remaining`}</CardDescription>
        </div>
        <p className="shrink-0 text-sm font-normal tabular-nums text-fg" aria-label={`${meta.label}: ${valueText}`}>
          {value} <span className="text-fg-3">/ {target}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Progress value={value} max={target} label={`${meta.label} completed today`} valueText={valueText} />
        <div className="flex justify-end gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={`Subtract one ${meta.singular}`}
            onClick={() => onChange(Math.max(0, value - 1))}
          >
            <Icon icon={Subtract} size={16} />
          </Button>
          <Button
            size="icon-sm"
            variant="primary"
            aria-label={`Add one ${meta.singular}`}
            onClick={() => onChange(value + 1)}
          >
            <Icon icon={Add} size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContributionDot({ level, interactive = false }: { level: number; interactive?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block size-2 rounded-sm bg-surface-3 ${interactive ? "transition-[scale] duration-(--dur-instant) group-hover:scale-125 group-focus-visible:scale-125" : ""}`}
    >
      {level > 0 && (
        <span className={`absolute inset-0 rounded-sm ${contributionLevelClass[level]}`} />
      )}
    </span>
  );
}

function ContributionGraph({ goals, targets, streak }: { goals: Goals; targets: Targets; streak: number }) {
  const days = useMemo(() => buildContributionDays(goals, targets), [goals, targets]);
  const completeDays = days.filter((day) => day.complete).length;
  const totalReplies = days.reduce((total, day) => total + day.replies, 0);

  return (
    <section aria-labelledby="contribution-title" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="contribution-title" className="text-lg font-normal leading-tight">{streak} day streak</h2>
          <p className="text-sm text-fg-3">{completeDays} complete {completeDays === 1 ? "day" : "days"} in 2026</p>
        </div>
        <div className="flex gap-5 text-end">
          <p className="text-sm text-fg-3"><span className="block font-normal text-fg tabular-nums">{streak}</span>Best</p>
          <p className="text-sm text-fg-3"><span className="block font-normal text-fg tabular-nums">{totalReplies.toLocaleString()}</span>Replies</p>
        </div>
      </div>
      <Card variant="surface">
        <CardContent>
          <div className="flex justify-between text-xs text-fg-3" aria-hidden="true">
            <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <TooltipProvider delay={250}>
              <div className="grid min-w-max grid-flow-col grid-rows-7 gap-1" role="grid" aria-label="2026 daily distribution history">
                {days.map((day) => {
                  const status = day.complete ? "Goals complete" : day.future ? "No activity yet" : `${day.percentage}% complete`;
                  const postLabel = `${day.posts} ${day.posts === 1 ? "post" : "posts"}`;
                  const label = `${dateLabel(day.iso)}. ${day.replies} replies. ${postLabel}. ${status}.`;
                  return (
                    <Tooltip key={day.iso}>
                      <TooltipTrigger
                        className="group block"
                        aria-label={label}
                      >
                        <ContributionDot level={day.level} interactive />
                      </TooltipTrigger>
                      <TooltipContent>
                        {dateLabel(day.iso)} · {day.replies} replies · {day.posts} {day.posts === 1 ? "post" : "posts"} · {status}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-fg-3" aria-hidden="true">
            <span className="me-1">Less</span>
            {contributionLevelClass.map((levelClass, level) => (
              <span key={level} className={`block size-2 rounded-sm ${levelClass}`} />
            ))}
            <span className="ms-1">Complete</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function TodayView({
  goals,
  targets,
  onSave,
  justCompleted,
}: {
  goals: Goals;
  targets: Targets;
  onSave: (goals: Goals) => Promise<void>;
  justCompleted: boolean;
}) {
  const [draftGoals, setDraftGoals] = useState(goals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeKeys: GoalKey[] = ["replies", "posts"];
  const streak = draftGoals.replies >= targets.replies && draftGoals.posts >= targets.posts ? 1 : 0;

  return (
    <section aria-label="Today" className="flex w-full max-w-2xl flex-col gap-7">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-pixel-square text-3xl font-normal leading-tight tracking-tight">Good morning, Austin</h1>
        <p className="text-base text-fg-2">Wednesday, October 7</p>
      </div>

      <ContributionGraph goals={draftGoals} targets={targets} streak={streak} />

      <section aria-labelledby="goals-title" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="goals-title" className="text-lg font-normal leading-tight">X goals</h2>
            <p className="text-sm text-fg-3">Complete both to extend the streak.</p>
          </div>
          {justCompleted && <p role="status" className="text-sm font-normal text-success-text">Today complete · {streak} day streak</p>}
        </div>
        <div className={activeKeys.length > 1 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
          {activeKeys.map((key) => (
            <GoalCard
              key={key}
              goalKey={key}
              value={draftGoals[key]}
              target={targets[key]}
              onChange={(value) => setDraftGoals((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </div>
        {error && <p className="text-sm text-danger-text" role="alert">{error}</p>}
        <div className="flex justify-end">
          <Button
            type="button"
            pending={saving}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                await onSave(draftGoals);
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "We couldn’t save today’s activity.");
              } finally {
                setSaving(false);
              }
            }}
          >
            Save changes
          </Button>
        </div>
      </section>
    </section>
  );
}

function GoalField({ goalKey, target, onChange }: { goalKey: GoalKey; target: number; onChange: (value: number) => void }) {
  return (
    <Field name={`${goalKey}-target`}>
      <FieldLabel className="font-normal">{goalMeta[goalKey].label}</FieldLabel>
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        value={target}
        onValueChange={(value) => onChange(Math.max(1, Number(value) || 1))}
      />
      <FieldDescription>Required each day.</FieldDescription>
    </Field>
  );
}

function SettingsView({
  targets,
  setTarget,
  dark,
  setDark,
  onDone,
}: {
  targets: Targets;
  setTarget: (key: GoalKey, value: number) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  onDone: () => void;
}) {
  return (
    <section aria-labelledby="settings-title" className="flex w-full max-w-2xl flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 id="settings-title" className="text-2xl font-normal tracking-tight">Settings</h1>
          <p className="text-sm text-fg-3">Goals save as you change them.</p>
        </div>
        <Button onClick={onDone}>Done</Button>
      </div>

      <Card variant="surface">
        <CardHeader>
          <h2 className="text-lg font-normal leading-tight">Daily goals</h2>
          <CardDescription>These numbers decide whether the day extends your streak.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <GoalField goalKey="replies" target={targets.replies} onChange={(value) => setTarget("replies", value)} />
            <GoalField goalKey="posts" target={targets.posts} onChange={(value) => setTarget("posts", value)} />
          </div>
        </CardContent>
      </Card>

      <Card variant="surface">
        <CardHeader>
          <h2 className="text-lg font-normal leading-tight">Appearance</h2>
          <CardDescription>Use the same Lime system in light or dark mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span className="text-sm font-normal">Dark mode</span>
            <Switch checked={dark} onCheckedChange={setDark} />
          </label>
        </CardContent>
      </Card>
    </section>
  );
}

export default function Launchpad() {
  const [view, setView] = useState<View>("Today");
  const [goals, setGoals] = useState<Goals>(INITIAL_GOALS);
  const [targets, setTargets] = useState<Targets>(INITIAL_TARGETS);
  const [dark, setDark] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const hydrated = useRef(false);
  const wasComplete = useRef(false);
  const complete = goals.replies >= targets.replies && goals.posts >= targets.posts;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        queueMicrotask(() => {
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.targets) setTargets(parsed.targets);
          if (typeof parsed.dark === "boolean") setDark(parsed.dark);
        });
      } catch {
        // Keep the seeded local state when stored data is invalid.
      }
    }
    hydrated.current = true;
    void fetch("/api/activity")
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ activity?: { replies_count: number; posts_count: number } }>;
      })
      .then((result) => {
        if (!result?.activity) return;
        setGoals({ replies: result.activity.replies_count, posts: result.activity.posts_count });
      })
      .catch(() => {
        // Keep local state when the activity request is unavailable.
      });
  }, []);

  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
    if (hydrated.current) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals, targets, dark }));
    }
  }, [dark, goals, targets]);

  useEffect(() => {
    if (complete && !wasComplete.current && hydrated.current) {
      setJustCompleted(true);
      const timer = window.setTimeout(() => setJustCompleted(false), 4200);
      wasComplete.current = true;
      return () => window.clearTimeout(timer);
    }
    wasComplete.current = complete;
  }, [complete]);

  const saveGoals = async (nextGoals: Goals) => {
    const response = await fetch("/api/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        activityDate: TODAY,
        repliesCount: nextGoals.replies,
        postsCount: nextGoals.posts,
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(result?.error ?? "We couldn’t save today’s activity.");
    }
    setGoals(nextGoals);
  };
  const setTarget = (key: GoalKey, value: number) => setTargets((current) => ({ ...current, [key]: value }));

  return (
    <main className="flex min-h-dvh flex-col bg-page text-fg">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2 font-normal")}>
          <Icon icon={CircleDash} size={20} />
          <span>The Scene</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dark ? "Use light mode" : "Use dark mode"}
            onClick={() => setDark((value) => !value)}
          >
            <Icon icon={dark ? Sun : Moon} size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={view === "Settings" ? "Return to today" : "Open settings"}
            aria-pressed={view === "Settings"}
            onClick={() => setView((current) => current === "Settings" ? "Today" : "Settings")}
          >
            <Icon icon={Settings} size={16} />
          </Button>
          <AccountMenu />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        {view === "Today" ? (
          <TodayView
            goals={goals}
            targets={targets}
            onSave={saveGoals}
            justCompleted={justCompleted}
          />
        ) : (
          <SettingsView
            targets={targets}
            setTarget={setTarget}
            dark={dark}
            setDark={setDark}
            onDone={() => setView("Today")}
          />
        )}
      </div>
    </main>
  );
}
