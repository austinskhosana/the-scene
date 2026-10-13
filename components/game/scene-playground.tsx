"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/lime/ui/button";
import { Card } from "@/components/lime/ui/card";
import { Slider } from "@/components/lime/ui/slider";
import { ArrowLeft, ArrowRight, ArrowUp, CircleDash, Icon, Pause, Play, Renew, Send } from "@/components/lime/icon";
import { cn } from "@/lib/lime/utils";
import {
  getSceneSoldierFrame,
  sceneSoldierAnimations,
  SCENE_SOLDIER_COLUMN_GUTTER,
  SCENE_SOLDIER_GRID,
  SCENE_SOLDIER_ROW_GUTTER,
  SCENE_SOLDIER_SHEET,
  type SceneSoldierAnimation,
} from "@/lib/game/scene-soldier";

type GameState = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: 1 | -1;
  grounded: boolean;
  runDistance: number;
  animation: SceneSoldierAnimation;
  animationStartedAt: number;
  shootingUntil: number;
  lastShotAt: number;
};

type Projectile = {
  x: number;
  y: number;
  velocityX: number;
};

type RunPreview = {
  active: boolean;
  playing: boolean;
  elapsedMs: number;
  frameIndex: number;
};

type Palette = {
  page: string;
  surface: string;
  surface2: string;
  line: string;
  foreground: string;
  muted: string;
  accent: string;
};

const EMPTY_PALETTE: Palette = {
  page: "transparent",
  surface: "transparent",
  surface2: "transparent",
  line: "transparent",
  foreground: "transparent",
  muted: "transparent",
  accent: "transparent",
};

const PLAYER_SIZE = 116;
const MOVE_SPEED = 170;
const MOVE_ACCELERATION = 900;
const MOVE_DECELERATION = 1200;
const JUMP_SPEED = 570;
const GRAVITY = 1550;
const SHOT_COOLDOWN = 220;
const SHOOT_DURATION = 560;
const RUN_FRAME_COUNT = sceneSoldierAnimations.run.frames.length;
const RUN_FRAME_DURATION = 1000 / sceneSoldierAnimations.run.fps;

function initialGameState(): GameState {
  return {
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    facing: 1,
    grounded: true,
    runDistance: 0,
    animation: "idle",
    animationStartedAt: 0,
    shootingUntil: 0,
    lastShotAt: 0,
  };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function moveTowards(current: number, target: number, maximumChange: number) {
  if (current < target) return Math.min(current + maximumChange, target);
  if (current > target) return Math.max(current - maximumChange, target);
  return target;
}

export function ScenePlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef<GameState>(initialGameState());
  const projectilesRef = useRef<Projectile[]>([]);
  const pressedKeysRef = useRef(new Set<string>());
  const resetRequestedRef = useRef(true);
  const jumpRequestedRef = useRef(false);
  const shootRequestedRef = useRef(false);
  const runPreviewRef = useRef<RunPreview>({ active: false, playing: false, elapsedMs: 0, frameIndex: 0 });
  const [ready, setReady] = useState(false);
  const [runPreviewActive, setRunPreviewActive] = useState(false);
  const [runPreviewPlaying, setRunPreviewPlaying] = useState(false);
  const [runPreviewFrame, setRunPreviewFrame] = useState(1);

  const leaveRunPreview = useCallback(() => {
    const preview = runPreviewRef.current;
    if (!preview.active && !preview.playing) return;
    preview.active = false;
    preview.playing = false;
    setRunPreviewActive(false);
    setRunPreviewPlaying(false);
  }, []);

  const resetCharacter = useCallback(() => {
    leaveRunPreview();
    resetRequestedRef.current = true;
    projectilesRef.current = [];
  }, [leaveRunPreview]);

  const pressDirection = useCallback((direction: "left" | "right", pressed: boolean) => {
    const code = direction === "left" ? "ArrowLeft" : "ArrowRight";
    if (pressed) {
      leaveRunPreview();
      pressedKeysRef.current.add(code);
    }
    else pressedKeysRef.current.delete(code);
  }, [leaveRunPreview]);

  const requestJump = useCallback(() => {
    leaveRunPreview();
    jumpRequestedRef.current = true;
  }, [leaveRunPreview]);

  const requestShot = useCallback(() => {
    leaveRunPreview();
    shootRequestedRef.current = true;
  }, [leaveRunPreview]);

  const toggleRunPreview = useCallback(() => {
    const preview = runPreviewRef.current;
    if (!preview.active) {
      preview.active = true;
      preview.playing = true;
      preview.elapsedMs = (runPreviewFrame - 1) * RUN_FRAME_DURATION;
      preview.frameIndex = runPreviewFrame - 1;
    } else {
      preview.playing = !preview.playing;
    }
    setRunPreviewActive(preview.active);
    setRunPreviewPlaying(preview.playing);
  }, [runPreviewFrame]);

  const scrubRunFrame = useCallback((value: number | readonly number[]) => {
    const values = Array.isArray(value) ? value : [value];
    const nextFrame = Math.max(1, Math.min(RUN_FRAME_COUNT, Math.round(values[0] ?? 1)));
    const preview = runPreviewRef.current;
    preview.active = true;
    preview.playing = false;
    preview.frameIndex = nextFrame - 1;
    preview.elapsedMs = (nextFrame - 1) * RUN_FRAME_DURATION;
    setRunPreviewActive(true);
    setRunPreviewPlaying(false);
    setRunPreviewFrame(nextFrame);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = SCENE_SOLDIER_SHEET;
    image.onload = () => {
      imageRef.current = image;
      setReady(true);
    };

    return () => {
      image.onload = null;
    };
  }, []);

  useEffect(() => {
    const pressedKeys = pressedKeysRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("button, a, input, textarea, select, [role=slider]"))
      ) {
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyJ"].includes(event.code)) {
        event.preventDefault();
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyJ"].includes(event.code)) {
        leaveRunPreview();
      }
      pressedKeys.add(event.code);
      if (["ArrowUp", "Space", "KeyW"].includes(event.code) && !event.repeat) jumpRequestedRef.current = true;
      if (event.code === "KeyJ" && !event.repeat) shootRequestedRef.current = true;
    };
    const onKeyUp = (event: KeyboardEvent) => pressedKeys.delete(event.code);
    const clearKeys = () => pressedKeys.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
  }, [leaveRunPreview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const context = canvas.getContext("2d");
    const image = imageRef.current;
    if (!context || !image) return;

    let animationFrame = 0;
    let previousTime = performance.now();
    let logicalWidth = 0;
    let logicalHeight = 0;
    let palette = EMPTY_PALETTE;

    const readPalette = () => {
      const styles = getComputedStyle(canvas);
      palette = {
        page: styles.getPropertyValue("--page").trim(),
        surface: styles.getPropertyValue("--surface").trim(),
        surface2: styles.getPropertyValue("--surface-2").trim(),
        line: styles.getPropertyValue("--line").trim(),
        foreground: styles.getPropertyValue("--fg").trim(),
        muted: styles.getPropertyValue("--fg-3").trim(),
        accent: styles.getPropertyValue("--accent").trim(),
      };
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      logicalWidth = Math.max(bounds.width, 1);
      logicalHeight = Math.max(bounds.height, 1);
      canvas.width = Math.round(logicalWidth * density);
      canvas.height = Math.round(logicalHeight * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.imageSmoothingEnabled = false;
      readPalette();
      resetRequestedRef.current = true;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const switchAnimation = (next: SceneSoldierAnimation, time: number) => {
      const state = stateRef.current;
      if (state.animation !== next) {
        state.animation = next;
        state.animationStartedAt = time;
      }
    };

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.035);
      previousTime = time;
      const state = stateRef.current;
      const runPreview = runPreviewRef.current;
      const platformWidth = Math.min(logicalWidth - 32, 760);
      const platformX = (logicalWidth - platformWidth) / 2;
      const platformY = logicalHeight - 76;
      const platformHeight = 48;
      const leftBound = platformX - PLAYER_SIZE * 0.16;
      const rightBound = platformX + platformWidth - PLAYER_SIZE * 0.84;
      const floorY = platformY - PLAYER_SIZE * 0.82;

      if (resetRequestedRef.current) {
        Object.assign(state, initialGameState(), {
          x: platformX + platformWidth * 0.24,
          y: floorY,
          animationStartedAt: time,
        });
        resetRequestedRef.current = false;
      }

      const left = pressedKeysRef.current.has("ArrowLeft") || pressedKeysRef.current.has("KeyA");
      const right = pressedKeysRef.current.has("ArrowRight") || pressedKeysRef.current.has("KeyD");
      const direction = Number(right) - Number(left);
      const targetVelocityX = direction * MOVE_SPEED;
      const velocityChange = (direction === 0 ? MOVE_DECELERATION : MOVE_ACCELERATION) * delta;
      state.velocityX = moveTowards(state.velocityX, targetVelocityX, velocityChange);
      if (direction !== 0) state.facing = direction > 0 ? 1 : -1;

      if (runPreview.active) {
        state.velocityX = 0;
        state.velocityY = 0;
        state.grounded = true;
        state.y = floorY;
      }

      if (jumpRequestedRef.current && state.grounded) {
        state.velocityY = -JUMP_SPEED;
        state.grounded = false;
      }
      jumpRequestedRef.current = false;

      if (shootRequestedRef.current && time - state.lastShotAt >= SHOT_COOLDOWN) {
        state.lastShotAt = time;
        state.shootingUntil = time + SHOOT_DURATION;
        projectilesRef.current.push({
          x: state.x + PLAYER_SIZE * (state.facing === 1 ? 0.78 : 0.22),
          y: state.y + PLAYER_SIZE * 0.46,
          velocityX: state.facing * 660,
        });
      }
      shootRequestedRef.current = false;

      state.velocityY += GRAVITY * delta;
      const previousX = state.x;
      state.x = Math.max(leftBound, Math.min(rightBound, state.x + state.velocityX * delta));
      state.runDistance += Math.abs(state.x - previousX);
      if (state.x === previousX && direction !== 0) state.velocityX = 0;
      state.y += state.velocityY * delta;
      if (state.y >= floorY) {
        state.y = floorY;
        state.velocityY = 0;
        state.grounded = true;
      }

      if (runPreview.active) switchAnimation("run", time);
      else if (time < state.shootingUntil) switchAnimation("shoot", time);
      else if (!state.grounded) switchAnimation(state.velocityY < 80 ? "jump" : "fall", time);
      else if (Math.abs(state.velocityX) > 8) switchAnimation("run", time);
      else switchAnimation("idle", time);

      projectilesRef.current = projectilesRef.current
        .map((projectile) => ({ ...projectile, x: projectile.x + projectile.velocityX * delta }))
        .filter((projectile) => projectile.x > -24 && projectile.x < logicalWidth + 24);

      context.clearRect(0, 0, logicalWidth, logicalHeight);

      context.fillStyle = palette.surface2;
      roundedRect(context, 12, 12, logicalWidth - 24, logicalHeight - 24, 16);
      context.fill();

      context.fillStyle = palette.surface;
      context.strokeStyle = palette.line;
      context.lineWidth = 1;
      roundedRect(context, platformX, platformY, platformWidth, platformHeight, 16);
      context.fill();
      context.stroke();

      context.fillStyle = palette.muted;
      context.font = "500 12px var(--font-geist-sans), sans-serif";
      context.fillText("STREAK 12", platformX + 18, platformY + 29);

      const dotSize = 9;
      const dotGap = 7;
      const dotsWidth = dotSize * 12 + dotGap * 11;
      const dotStart = platformX + platformWidth - dotsWidth - 18;
      for (let index = 0; index < 12; index += 1) {
        context.fillStyle = palette.accent;
        roundedRect(context, dotStart + index * (dotSize + dotGap), platformY + 20, dotSize, dotSize, 3);
        context.fill();
      }

      for (const projectile of projectilesRef.current) {
        context.fillStyle = palette.accent;
        context.shadowColor = palette.accent;
        context.shadowBlur = 8;
        roundedRect(context, projectile.x, projectile.y, 14, 5, 3);
        context.fill();
      }
      context.shadowBlur = 0;

      if (runPreview.active && runPreview.playing) {
        runPreview.elapsedMs += delta * 1000;
        const nextFrameIndex = Math.floor(runPreview.elapsedMs / RUN_FRAME_DURATION) % RUN_FRAME_COUNT;
        if (nextFrameIndex !== runPreview.frameIndex) {
          runPreview.frameIndex = nextFrameIndex;
          setRunPreviewFrame(nextFrameIndex + 1);
        }
      }
      const animationElapsed = runPreview.active
        ? runPreview.elapsedMs
        : state.animation === "run"
          ? (state.runDistance / MOVE_SPEED) * 1000
          : time - state.animationStartedAt;
      const frame = getSceneSoldierFrame(state.animation, animationElapsed);
      const sourceWidth = image.width / SCENE_SOLDIER_GRID.columns;
      const sourceHeight = image.height / SCENE_SOLDIER_GRID.rows;
      const sourceInsetLeft = frame.column === 0 ? 0 : SCENE_SOLDIER_COLUMN_GUTTER;
      const sourceInsetTop = frame.row === 0 ? 0 : SCENE_SOLDIER_ROW_GUTTER;
      const destinationInsetLeft = PLAYER_SIZE * (sourceInsetLeft / sourceWidth);
      const destinationInsetTop = PLAYER_SIZE * (sourceInsetTop / sourceHeight);
      context.save();
      if (state.facing === -1) {
        context.translate(state.x + PLAYER_SIZE, 0);
        context.scale(-1, 1);
        context.drawImage(
          image,
          frame.column * sourceWidth + sourceInsetLeft,
          frame.row * sourceHeight + sourceInsetTop,
          sourceWidth - sourceInsetLeft,
          sourceHeight - sourceInsetTop,
          destinationInsetLeft,
          state.y + destinationInsetTop,
          PLAYER_SIZE - destinationInsetLeft,
          PLAYER_SIZE - destinationInsetTop,
        );
      } else {
        context.drawImage(
          image,
          frame.column * sourceWidth + sourceInsetLeft,
          frame.row * sourceHeight + sourceInsetTop,
          sourceWidth - sourceInsetLeft,
          sourceHeight - sourceInsetTop,
          state.x + destinationInsetLeft,
          state.y + destinationInsetTop,
          PLAYER_SIZE - destinationInsetLeft,
          PLAYER_SIZE - destinationInsetTop,
        );
      }
      context.restore();

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [ready]);

  return (
    <main className="flex min-h-dvh flex-col bg-page text-fg">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center justify-between px-4 sm:px-6">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2")}>
          <Icon icon={CircleDash} size={20} />
          <span>The Scene</span>
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <Icon icon={ArrowLeft} size={16} />
          Back
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-pixel-square text-2xl leading-tight tracking-tight">Movement playground</h1>
          <p className="max-w-2xl text-sm leading-normal text-fg-2">
            Tune how she feels before she enters the landing page. Use A/D or the arrow keys to move, Space to jump, and J to shoot.
          </p>
        </div>

        <Card variant="raised" className="gap-3 p-3 sm:p-4">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label="Interactive character playground. Use left and right arrows to move, up arrow to jump, and J to shoot."
            className="playground-canvas w-full rounded-panel focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            onPointerDown={(event) => {
              event.currentTarget.focus();
              requestShot();
            }}
          />

          <section className="flex flex-col gap-3 px-1 py-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Run cycle</h2>
                <p className="text-sm text-fg-2">
                  {runPreviewActive ? `Inspecting frame ${runPreviewFrame} of ${RUN_FRAME_COUNT}.` : "Drag the slider to inspect each frame."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Icon icon={runPreviewPlaying ? Pause : Play} size={16} />}
                onClick={toggleRunPreview}
              >
                {runPreviewPlaying ? "Pause preview" : "Play preview"}
              </Button>
            </div>
            <Slider
              aria-label="Run cycle frame"
              value={[runPreviewFrame]}
              min={1}
              max={RUN_FRAME_COUNT}
              step={1}
              thumbLabels={["Run cycle frame"]}
              showValue
              onValueChange={scrubRunFrame}
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1">
            <div className="flex items-center gap-2" aria-label="Movement controls">
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Move left"
                onPointerDown={() => pressDirection("left", true)}
                onPointerUp={() => pressDirection("left", false)}
                onPointerCancel={() => pressDirection("left", false)}
                onPointerLeave={() => pressDirection("left", false)}
              >
                <Icon icon={ArrowLeft} size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Move right"
                onPointerDown={() => pressDirection("right", true)}
                onPointerUp={() => pressDirection("right", false)}
                onPointerCancel={() => pressDirection("right", false)}
                onPointerLeave={() => pressDirection("right", false)}
              >
                <Icon icon={ArrowRight} size={16} />
              </Button>
              <Button variant="outline" size="icon-lg" aria-label="Jump" onClick={requestJump}>
                <Icon icon={ArrowUp} size={16} />
              </Button>
              <Button variant="solid" size="lg" icon={<Icon icon={Send} size={16} />} onClick={requestShot}>
                Shoot
              </Button>
            </div>
            <Button variant="primary" size="lg" icon={<Icon icon={Renew} size={16} />} onClick={resetCharacter}>
              Reset character
            </Button>
          </div>
        </Card>

        <p className="text-sm text-fg-2">
          This is an internal motion study. Multiplayer and landing-page integration come next, after we tune her together.
        </p>
      </div>
    </main>
  );
}
