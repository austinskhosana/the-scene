"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/lime/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/lime/ui/card";
import { LandingSoldier } from "@/components/game/landing-soldier";
import { GameCaseScene } from "@/components/three/scene-case";
import { SceneRevealLoader } from "@/components/scene/scene-reveal-loader";
import { useSceneSound } from "@/components/scene/use-scene-sound";
import { ArrowRight, CircleDash, Icon, LogoGithub, VideoGame, VolumeMuteFilled, VolumeUpFilled } from "@/components/lime/icon";
import { cn } from "@/lib/lime/utils";

const contributionLevelClass = ["bg-surface-3", "bg-surface-3", "bg-accent-line", "bg-accent"];
const contributionLegendClass = ["bg-surface-3", "bg-surface-3", "bg-surface-3", "bg-accent"];
const REVEAL_HOLD_MS = 4000;
const contributionDays = Array.from({ length: 364 }, (_, index) => {
  if (index > 278) return 0;
  if (index % 17 === 0 || index % 29 === 0) return 3;
  if (index % 7 === 0 || index % 11 === 0) return 2;
  if (index % 5 === 0) return 1;
  return 0;
});

export default function Home() {
  const { isSignedIn } = useAuth();
  const {
    soundEnabled,
    setSoundEnabled,
    playSound,
    primeMusic,
    startMusic,
    stopMusic,
  } = useSceneSound();
  const [openSourceWorld, setOpenSourceWorld] = useState(false);
  const [initialDestination, setInitialDestination] = useState<"cover" | "landing">("cover");
  const [revealPhase, setRevealPhase] = useState<
    "initial" | "initial-opening" | "closed" | "explore-covering" | "explore-opening"
  >("initial");

  const enterPipe = useCallback(() => {
    setOpenSourceWorld(true);
  }, []);

  const handleExplore = useCallback(() => {
    primeMusic();
    playSound("paperCover");
    window.history.replaceState(null, "", "#landing-game");
    setRevealPhase("explore-covering");
  }, [playSound, primeMusic]);

  const handleReturnToCover = useCallback(() => {
    stopMusic();
    window.history.replaceState(null, "", "#case-cover");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stopMusic]);

  const finishReveal = useCallback(() => {
    const isLandingReveal =
      revealPhase === "explore-opening" ||
      (revealPhase === "initial-opening" && initialDestination === "landing");
    if (isLandingReveal) startMusic();
    setRevealPhase("closed");
  }, [initialDestination, revealPhase, startMusic]);

  useEffect(() => {
    if (revealPhase !== "initial") return;

    if (window.location.hash === "#landing-game") {
      const landingGame = document.getElementById("landing-game");
      if (landingGame) {
        setInitialDestination("landing");
        window.scrollTo({ top: landingGame.offsetTop, behavior: "auto" });
      }
    }

    const timer = window.setTimeout(() => {
      setRevealPhase("initial-opening");
    }, REVEAL_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [revealPhase]);

  useEffect(() => {
    if (revealPhase !== "explore-covering") return;

    const landingGame = document.getElementById("landing-game");
    if (!landingGame) return;

    window.scrollTo({ top: landingGame.offsetTop, behavior: "auto" });
    const timer = window.setTimeout(() => {
      playSound("paperReveal");
      setRevealPhase("explore-opening");
    }, REVEAL_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [playSound, revealPhase]);

  useEffect(() => {
    if (!openSourceWorld) return;

    const openSourceSection = document.getElementById("open-source-world");
    if (!openSourceSection) return;

    const targetTop = openSourceSection.offsetTop;
    const lockScrollPosition = () => window.scrollTo({ top: targetTop, behavior: "auto" });
    const preventBacktracking = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
      lockScrollPosition();
    };
    const preventBacktrackingWithKeys = (event: KeyboardEvent) => {
      if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
        event.preventDefault();
        lockScrollPosition();
      }
    };

    window.scrollTo({ top: targetTop, behavior: "smooth" });
    window.addEventListener("wheel", preventBacktracking, { passive: false });
    window.addEventListener("touchmove", preventBacktracking, { passive: false });
    window.addEventListener("keydown", preventBacktrackingWithKeys);

    const lockTimer = window.setTimeout(() => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      lockScrollPosition();
    }, 700);

    return () => {
      window.clearTimeout(lockTimer);
      window.removeEventListener("wheel", preventBacktracking);
      window.removeEventListener("touchmove", preventBacktracking);
      window.removeEventListener("keydown", preventBacktrackingWithKeys);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [openSourceWorld]);

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-x-clip bg-page text-fg">
      <section id="case-cover" className="case-hero" aria-labelledby="case-hero-title">
        <h1 id="case-hero-title" className="sr-only">The Scene interactive game case</h1>
        <GameCaseScene
          onExplore={handleExplore}
          soundEnabled={soundEnabled}
          onSoundEnabledChange={setSoundEnabled}
          playSound={playSound}
        />
      </section>
      {revealPhase !== "closed" && revealPhase !== "initial" && (
        <SceneRevealLoader
          phase={revealPhase === "explore-covering" ? "covering" : "opening"}
          onAnimationEnd={finishReveal}
        />
      )}
      {revealPhase === "initial" && (
        <SceneRevealLoader
          phase="covering"
          onAnimationEnd={finishReveal}
        />
      )}
      <section id="landing-game" className="landing-world relative h-dvh overflow-hidden">
        <div aria-hidden="true" className="landing-ground pointer-events-none absolute inset-x-0 z-40">
          <span data-ground-platform className="landing-ground-surface absolute inset-x-0" />
        </div>
        <div data-pipe-platform className="landing-pipe pointer-events-none absolute z-10">
          <img src="/game/the-scene/warp-pipe.png" alt="" aria-hidden="true" className="landing-pipe-image" />
        </div>
        <LandingSoldier
          className="absolute inset-x-0 top-0 z-20 h-dvh"
          onEnterPipe={enterPipe}
          playSound={playSound}
        />
        <div aria-hidden="true" className="landing-pipe pointer-events-none absolute z-30">
          <img src="/game/the-scene/warp-pipe.png" alt="" className="landing-pipe-image" />
        </div>

      <header className="relative z-30 mx-auto! flex h-16 w-full max-w-5xl shrink-0 items-center justify-between px-4 sm:px-6">
        <Link
          href="/#case-cover"
          onClick={(event) => {
            event.preventDefault();
            handleReturnToCover();
          }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2")}
        >
          <Icon icon={CircleDash} size={20} />
          <span>The Scene</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Icon icon={soundEnabled ? VolumeUpFilled : VolumeMuteFilled} size={16} />
            <span>{soundEnabled ? "Sound on" : "Sound off"}</span>
          </Button>
          <Link
            href="https://github.com/austinskhosana/the-scene"
            target="_blank"
            rel="noreferrer"
            aria-label="Open The Scene on GitHub"
            className={cn(buttonVariants({ variant: "solid", size: "sm" }), "shadow-card")}
          >
            <Icon icon={LogoGithub} size={16} />
            <span>GitHub</span>
          </Link>
        </div>
      </header>

        <div className="relative z-10 mx-auto! flex w-full max-w-5xl translate-y-6 flex-col px-4 sm:translate-y-8 sm:px-6">
        <section aria-labelledby="landing-title" className="flex items-center justify-center py-10 text-center sm:py-16">
          <div className="flex max-w-2xl translate-y-12 flex-col items-center gap-4 sm:translate-y-16 sm:gap-6">
            <div className="flex flex-col items-center gap-4">
              <h1 id="landing-title" className="font-pixel-square max-w-2xl text-3xl leading-tight tracking-tight">
                Build an X replying habit that connects you with real people.
              </h1>
              <p className="max-w-xl text-base leading-normal text-fg-2">
                The Scene helps you show up, reply with intention, and build real relationships on X, one conversation at a time. No bots or automated engagement.
              </p>
            </div>
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-in"}
              data-action-platform
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              <span>Start your streak</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </section>

        <section aria-labelledby="streak-title" className="mx-auto! w-full max-w-5xl sm:pb-6">
          <h2 id="streak-title" className="sr-only">Your streak</h2>
          <div className="landing-stage pointer-events-none relative">
            <div className="landing-streak-platform absolute inset-x-0 mx-auto! flex w-full max-w-4xl flex-col items-center gap-3">
              <Card data-streak-platform variant="surface" className="w-full text-start">
                <CardHeader className="w-full gap-4 sm:flex-row! sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle>12 day streak</CardTitle>
                    <CardDescription>63 complete days in 2026</CardDescription>
                  </div>
                  <div className="flex gap-5 text-end">
                    <p className="text-sm text-fg-3">
                      <span className="block font-medium tabular-nums text-fg">37</span>
                      Best
                    </p>
                    <p className="text-sm text-fg-3">
                      <span className="block font-medium tabular-nums text-fg">1,842</span>
                      Replies
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex w-max min-w-full flex-col gap-2">
                      <div className="flex justify-between text-xs text-fg-3" aria-hidden="true">
                        <span>Jan</span>
                        <span>Apr</span>
                        <span>Jul</span>
                        <span>Oct</span>
                        <span>Dec</span>
                      </div>
                      <div className="grid grid-flow-col grid-rows-7 gap-1" aria-label="2026 daily distribution history">
                        {contributionDays.map((level, day) => (
                          <span key={day} className="relative block size-2 rounded-sm bg-surface-3" aria-hidden="true">
                            {level > 0 && <span className={`absolute inset-0 rounded-sm ${contributionLevelClass[level]}`} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-fg-3" aria-hidden="true">
                    <span className="me-1">Less</span>
                    {contributionLegendClass.map((levelClass, level) => (
                      <span key={level} className={`block size-2 rounded-sm ${levelClass}`} />
                    ))}
                    <span className="ms-1">Complete</span>
                  </div>
                </CardContent>
              </Card>
              <p id="landing-controls" className="flex items-start justify-center gap-2 px-4 text-center text-sm text-fg-2">
                <Icon icon={VideoGame} size={24} className="landing-controls-icon" />
                <span className="landing-controls-mobile">Tap a bot to destroy it.</span>
                <span className="landing-controls-desktop">Use the arrow keys to move, jump, and drop down. Press J to shoot.</span>
              </p>
            </div>
          </div>
        </section>
      </div>
      </section>

      {openSourceWorld && (
        <section
          id="open-source-world"
          aria-labelledby="open-source-title"
          className="landing-open-source relative isolate flex h-dvh items-center justify-center overflow-hidden px-4 py-24 text-center sm:px-6"
        >
          <div aria-hidden="true" data-ground-platform className="landing-open-source-floor pointer-events-none absolute inset-x-0 bottom-0" />
          <Button
            type="button"
            variant="ghost"
            aria-label="Buy me intelligence"
            data-game-platform
            className="landing-intelligence-button absolute z-50"
            onClick={() => window.location.assign("https://austinskhosana.gumroad.com/coffee")}
          >
            <img
              src="/game/the-scene/buy-me-intelligence-robot-button.png"
              alt="Buy me intelligence"
              className="landing-intelligence-button-image"
            />
          </Button>
          <>
            <LandingSoldier
              spawnOnGround
              className="absolute inset-x-0 bottom-0 z-60 h-full"
              playSound={playSound}
            />
            <div className="relative z-20 flex max-w-md flex-col items-center gap-4 text-center">
              <Icon icon={LogoGithub} size={32} className="text-fg" />
              <h2 id="open-source-title" className="font-pixel-square text-2xl leading-tight tracking-tight sm:text-3xl">
                The Scene is open source.
              </h2>
              <p className="text-base leading-normal text-fg-2">
                Remix the landing page, build a new world, and help shape the project with us.
              </p>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
              data-action-platform data-game-platform
                className={buttonVariants({ variant: "secondary", size: "md" })}
              >
                Explore the project on GitHub
                <Icon icon={ArrowRight} size={16} />
              </Link>
            </div>
          </>
        </section>
      )}
    </main>
  );
}
