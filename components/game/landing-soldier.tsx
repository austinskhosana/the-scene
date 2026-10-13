"use client";

import { useEffect, useRef } from "react";
import {
  getArtFrame,
  theSceneArt,
  type TheSceneArtDefinition,
  type TheSceneArtName,
} from "@/lib/game/the-scene-art";
import { cn } from "@/lib/lime/utils";

type LandingSoldierProps = { className?: string; onEnterPipe?: () => void; spawnOnGround?: boolean };
type PlatformSurface = "streak" | "action" | "pipe";
type Surface = PlatformSurface | "ground" | null;

type PlatformBounds = {
  surface: PlatformSurface;
  left: number;
  right: number;
  top: number;
};

type PlayerState = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: 1 | -1;
  grounded: boolean;
  standingOn: Surface;
  dropThroughUntil: number;
  walkDistance: number;
  airborneStartedAt: number;
  lastShotAt: number;
  shotProjectileReleased: boolean;
  pipeEnterStartedAt: number;
  pipeEntryComplete: boolean;
};

type Projectile = {
  x: number;
  y: number;
  velocityX: number;
  createdAt: number;
};

type Ghost = {
  id: number;
  x: number;
  y: number;
  bornAt: number;
  hitAt: number | null;
  phase: number;
  lastTrailAt: number;
  trailSequence: number;
};

type GhostTrailParticle = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  bornAt: number;
  lifetime: number;
  symbol: string;
};

const MOVE_SPEED = 180;
const MOVE_ACCELERATION = 960;
const MOVE_DECELERATION = 1240;
const JUMP_SPEED = 1200;
const GRAVITY = 1500;
const SHOOT_POSE_MS = 500;
const SHOT_RELEASE_MS = 250;
const SHOOT_SCALE_CORRECTION = 444 / 303;
const SHOOT_MUZZLE_OFFSET_X = 106;
const SHOOT_MUZZLE_OFFSET_Y = -242;
const AIRBORNE_SHOOT_MUZZLE_OFFSET_X = 174;
const AIRBORNE_SHOOT_MUZZLE_OFFSET_Y = -350;
const GHOST_MATERIALIZE_MS = 1000;
const GHOST_DATA_RING_MS = 220;
const GHOST_DISSOLVE_MS = 680;
const GHOST_SPAWN_MS = 6500;
const GHOST_CHASE_SPEED = 52;
const GHOST_STOP_DISTANCE = 82;
const GHOST_VISIBLE_HEIGHT = 340;
const GHOST_HOVER_AMPLITUDE = 10;
const GHOST_BOUNDING_PADDING = 12;
const GHOST_PLATFORM_CLEARANCE = 8;
const GHOST_HIT_HALF_WIDTH = 64;
const GHOST_HIT_HALF_HEIGHT = 96;
const GHOST_TRAIL_INTERVAL_MS = 74;
const GHOST_TRAIL_LIFETIME_MS = 920;
const GHOST_TRAIL_SYMBOLS = ["0", "1", "+", "*", "/", "#", "@", "?"] as const;
const PLAYER_CONTACT_INSET = 3;
const LOWER_LEVEL_CONTACT_INSET = 7;
const PIPE_ENTER_DURATION_MS = 650;
const PIPE_ENTER_DEPTH = 1.05;
const PIPE_ENTRY_CENTER_TOLERANCE = 0.22;

function initialPlayerState(): PlayerState {
  return {
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    facing: 1,
    grounded: true,
    standingOn: "streak",
    dropThroughUntil: 0,
    walkDistance: 0,
    airborneStartedAt: 0,
    lastShotAt: -SHOOT_POSE_MS,
    shotProjectileReleased: true,
    pipeEnterStartedAt: 0,
    pipeEntryComplete: false,
  };
}

function moveTowards(current: number, target: number, maximumChange: number) {
  if (current < target) return Math.min(current + maximumChange, target);
  if (current > target) return Math.max(current - maximumChange, target);
  return target;
}

function loadArt() {
  const entries = Object.entries(theSceneArt) as [TheSceneArtName, TheSceneArtDefinition][];
  return Object.fromEntries(
    entries.map(([name, definition]) => {
      const image = new Image();
      image.src = definition.src;
      return [name, image];
    }),
  ) as Record<TheSceneArtName, HTMLImageElement>;
}

export function LandingSoldier({ className, onEnterPipe, spawnOnGround = false }: LandingSoldierProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<TheSceneArtName, HTMLImageElement> | null>(null);
  const stateRef = useRef<PlayerState>(initialPlayerState());
  const projectilesRef = useRef<Projectile[]>([]);
  const ghostsRef = useRef<Ghost[]>([]);
  const ghostTrailRef = useRef<GhostTrailParticle[]>([]);
  const pressedKeysRef = useRef(new Set<string>());
  const resetRequestedRef = useRef(true);
  const jumpRequestedRef = useRef(false);
  const dropRequestedRef = useRef(false);
  const shootRequestedRef = useRef(false);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && !window.matchMedia("(pointer: coarse)").matches) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const tapX = event.clientX - bounds.left;
      const tapY = event.clientY - bounds.top;
      const now = performance.now();
      const target = ghostsRef.current
        .filter((ghost) => ghost.hitAt === null && now - ghost.bornAt >= GHOST_MATERIALIZE_MS * 0.55)
        .map((ghost) => ({
          ghost,
          distance: Math.hypot(tapX - ghost.x, tapY - (ghost.y + Math.sin(now / 650 + ghost.phase) * GHOST_HOVER_AMPLITUDE)),
        }))
        .filter(({ distance }) => distance <= Math.max(GHOST_HIT_HALF_WIDTH, GHOST_HIT_HALF_HEIGHT))
        .sort((first, second) => first.distance - second.distance)[0];
      if (target) target.ghost.hitAt = now;
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const images = loadArt();
    imagesRef.current = images;
    const onLoad = () => {
      resetRequestedRef.current = true;
    };
    Object.values(images).forEach((image) => image.addEventListener("load", onLoad));
    return () => Object.values(images).forEach((image) => image.removeEventListener("load", onLoad));
  }, []);

  useEffect(() => {
    const pressedKeys = pressedKeysRef.current;
    const controlKeys = new Set([
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
      "KeyA", "KeyD", "KeyW", "KeyS", "KeyJ",
    ]);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("button, a, input, textarea, select, [role=slider]"))
      ) return;
      if (!controlKeys.has(event.code)) return;
      event.preventDefault();
      pressedKeys.add(event.code);
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(event.code) && !event.repeat) {
        const direction = ["ArrowLeft", "KeyA"].includes(event.code) ? -1 : 1;
        stateRef.current.velocityX = direction * MOVE_SPEED;
        stateRef.current.facing = direction as 1 | -1;
      }
      if (["ArrowUp", "Space", "KeyW"].includes(event.code) && !event.repeat) jumpRequestedRef.current = true;
      if (["ArrowDown", "KeyS"].includes(event.code) && !event.repeat) dropRequestedRef.current = true;
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let animationFrame = 0;
    let previousTime = performance.now();
    let logicalWidth = 0;
    let logicalHeight = 0;
    let nextGhostId = 1;
    let nextGhostAt = previousTime + 1800;
    let accentColor = "";
    let isMobileViewport = false;
    const streakPlatform = canvas.parentElement?.querySelector<HTMLElement>("[data-streak-platform]") ?? null;
    const actionPlatform = canvas.parentElement?.querySelector<HTMLElement>("[data-action-platform]") ?? null;
    const pipePlatform = canvas.parentElement?.querySelector<HTMLElement>("[data-pipe-platform]") ?? null;
    const groundPlatform = canvas.parentElement?.querySelector<HTMLElement>("[data-ground-platform]") ?? null;

    const getElementBounds = (element: HTMLElement | null) => {
      const canvasBounds = canvas.getBoundingClientRect();
      const bounds = element?.getBoundingClientRect();
      if (!bounds) return { left: 0, right: logicalWidth, top: logicalHeight * 0.72 };
      return {
        left: bounds.left - canvasBounds.left,
        right: bounds.right - canvasBounds.left,
        top: bounds.top - canvasBounds.top,
      };
    };

    const getPlayerPlatforms = (): PlatformBounds[] => {
      const platforms: PlatformBounds[] = [];
      if (actionPlatform) platforms.push({ surface: "action", ...getElementBounds(actionPlatform) });
      if (streakPlatform) platforms.push({ surface: "streak", ...getElementBounds(streakPlatform) });
      if (pipePlatform) platforms.push({ surface: "pipe", ...getElementBounds(pipePlatform) });
      return platforms;
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      logicalWidth = Math.max(bounds.width, 1);
      logicalHeight = Math.max(bounds.height, 1);
      isMobileViewport = window.matchMedia("(max-width: 639px)").matches;
      canvas.width = Math.round(logicalWidth * density);
      canvas.height = Math.round(logicalHeight * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.imageSmoothingEnabled = false;
      const styles = getComputedStyle(canvas);
      accentColor = styles.getPropertyValue("--accent").trim() || styles.color;
      resetRequestedRef.current = true;
    };

    const drawSheetFrame = (
      name: TheSceneArtName,
      frame: number,
      anchorX: number,
      anchorY: number,
      displayScale: number,
      facing: 1 | -1 = 1,
      opacity = 1,
    ) => {
      const image = imagesRef.current?.[name];
      const definition = theSceneArt[name];
      if (!image?.complete || image.naturalWidth === 0) return false;
      const sourceX = frame * definition.cellWidth;
      const targetX = -definition.anchorX * displayScale;
      const targetY = -definition.anchorY * displayScale;
      context.save();
      context.globalAlpha = opacity;
      context.translate(Math.round(anchorX), Math.round(anchorY));
      context.scale(facing, 1);
      context.drawImage(
        image,
        sourceX,
        0,
        definition.cellWidth,
        definition.cellHeight,
        targetX,
        targetY,
        definition.cellWidth * displayScale,
        definition.cellHeight * displayScale,
      );
      context.restore();
      return true;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (streakPlatform) observer.observe(streakPlatform);
    if (actionPlatform) observer.observe(actionPlatform);
    if (pipePlatform) observer.observe(pipePlatform);
    if (groundPlatform) observer.observe(groundPlatform);
    resize();

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.035);
      previousTime = time;
      const state = stateRef.current;
      const playerSize = Math.min(132, Math.max(108, logicalWidth * 0.16));
      const playerScale = playerSize / 456;
      const shootScale = playerScale * SHOOT_SCALE_CORRECTION;
      const groundInset = Math.max(8, playerSize * 0.08);
      const groundTop = groundPlatform
        ? getElementBounds(groundPlatform).top
        : logicalHeight - groundInset;
      const groundY = groundTop - playerSize + (
        spawnOnGround ? LOWER_LEVEL_CONTACT_INSET : PLAYER_CONTACT_INSET
      );
      const rightBound = Math.max(0, logicalWidth - playerSize);
      const playerPlatforms = getPlayerPlatforms();
      const pipeBounds = playerPlatforms.find(({ surface }) => surface === "pipe");
      const pipeCenterX = pipeBounds ? (pipeBounds.left + pipeBounds.right) / 2 : 0;
      const pipeWidth = pipeBounds ? pipeBounds.right - pipeBounds.left : 0;
      const centeredOnPipe = Boolean(
        pipeBounds && Math.abs(state.x + playerSize / 2 - pipeCenterX) <= pipeWidth * PIPE_ENTRY_CENTER_TOLERANCE,
      );
      const getPlatformPlayerY = ({ surface, top }: PlatformBounds) =>
        top - playerSize + (surface === "pipe" ? PLAYER_CONTACT_INSET : 0);
      const platformBounds = playerPlatforms.find(({ surface }) => surface === "streak") ??
        { surface: "streak", left: 0, right: logicalWidth, top: logicalHeight * 0.72 };
      const ghostScale = playerSize / GHOST_VISIBLE_HEIGHT;
      const ghostHalfWidth = (theSceneArt.ghostFloat.cellWidth * ghostScale) / 2;
      const ghostBottomExtent =
        (theSceneArt.ghostFloat.cellHeight - theSceneArt.ghostFloat.anchorY) * ghostScale;
      const ghostCollisionHalfWidth = ghostHalfWidth + GHOST_BOUNDING_PADDING;
      const ghostCollisionBottomExtent = ghostBottomExtent + GHOST_BOUNDING_PADDING;
      const ghostPlatformMaxY =
        platformBounds.top - ghostCollisionBottomExtent - GHOST_HOVER_AMPLITUDE - GHOST_PLATFORM_CLEARANCE;

      if (resetRequestedRef.current) {
        const spawnPlatform = spawnOnGround && groundPlatform
          ? getElementBounds(groundPlatform)
          : platformBounds;
        Object.assign(state, initialPlayerState(), {
          x: Math.min(rightBound, spawnPlatform.left + (spawnPlatform.right - spawnPlatform.left) * 0.08),
          y: spawnOnGround ? 0 : spawnPlatform.top - playerSize,
          velocityY: spawnOnGround ? 260 : 0,
          grounded: !spawnOnGround,
          standingOn: spawnOnGround ? "ground" : platformBounds.surface,
          airborneStartedAt: time,
        });
        projectilesRef.current = [];
        ghostsRef.current = [];
        ghostTrailRef.current = [];
        nextGhostAt = time + 1800;
        resetRequestedRef.current = false;
      }

      const left = pressedKeysRef.current.has("ArrowLeft") || pressedKeysRef.current.has("KeyA");
      const right = pressedKeysRef.current.has("ArrowRight") || pressedKeysRef.current.has("KeyD");
      const pipeTransitionWasActive = state.pipeEnterStartedAt > 0 || state.pipeEntryComplete;
      const direction = pipeTransitionWasActive ? 0 : Number(right) - Number(left);
      state.velocityX = moveTowards(
        state.velocityX,
        direction * MOVE_SPEED,
        (direction === 0 ? MOVE_DECELERATION : MOVE_ACCELERATION) * delta,
      );
      if (direction !== 0) state.facing = direction > 0 ? 1 : -1;

      if (jumpRequestedRef.current && state.grounded && !pipeTransitionWasActive) {
        state.velocityY = -JUMP_SPEED;
        state.grounded = false;
        state.standingOn = null;
        state.airborneStartedAt = time;
      }
      jumpRequestedRef.current = false;

      if (
        dropRequestedRef.current &&
        state.grounded &&
        state.standingOn !== null &&
        state.standingOn === "pipe" &&
        centeredOnPipe
      ) {
        state.velocityX = 0;
        state.velocityY = 0;
        state.pipeEnterStartedAt = time;
        state.pipeEntryComplete = false;
        state.grounded = true;
        state.standingOn = "pipe";
      } else if (
        dropRequestedRef.current &&
        state.grounded &&
        state.standingOn !== null &&
        state.standingOn !== "ground" &&
        state.standingOn !== "pipe"
      ) {
        state.y += 8;
        state.velocityY = 80;
        state.grounded = false;
        state.standingOn = null;
        state.dropThroughUntil = time + 320;
        state.airborneStartedAt = time;
      }
      dropRequestedRef.current = false;

      const pipeEntering = state.pipeEnterStartedAt > 0;
      const pipeTransitionActive = pipeEntering || state.pipeEntryComplete;

      if (
        shootRequestedRef.current &&
        !pipeTransitionActive &&
        time - state.lastShotAt >= SHOOT_POSE_MS
      ) {
        state.lastShotAt = time;
        state.shotProjectileReleased = false;
      }
      const shootingElapsed = time - state.lastShotAt;
      if (
        !state.shotProjectileReleased &&
        shootingElapsed >= SHOT_RELEASE_MS &&
        shootingElapsed < SHOOT_POSE_MS
      ) {
        state.shotProjectileReleased = true;
        const muzzleScale = state.grounded ? shootScale : playerScale;
        const muzzleOffsetX = state.grounded ? SHOOT_MUZZLE_OFFSET_X : AIRBORNE_SHOOT_MUZZLE_OFFSET_X;
        const muzzleOffsetY = state.grounded ? SHOOT_MUZZLE_OFFSET_Y : AIRBORNE_SHOOT_MUZZLE_OFFSET_Y;
        projectilesRef.current.push({
          x: state.x + playerSize / 2 + state.facing * muzzleOffsetX * muzzleScale,
          y: state.y + playerSize + muzzleOffsetY * muzzleScale,
          velocityX: state.facing * 660,
          createdAt: time,
        });
      }
      shootRequestedRef.current = false;

      const previousX = state.x;
      state.x = Math.max(0, Math.min(rightBound, state.x + state.velocityX * delta));
      state.walkDistance += Math.abs(state.x - previousX);

      const leftFoot = state.x + playerSize * 0.35;
      const rightFoot = state.x + playerSize * 0.65;
      const standingPlatform = playerPlatforms.find(({ surface }) => surface === state.standingOn);
      if (
        state.grounded &&
        standingPlatform &&
        (leftFoot <= standingPlatform.left || rightFoot >= standingPlatform.right)
      ) {
        state.grounded = false;
        state.standingOn = null;
        state.airborneStartedAt = time;
      }

      if (pipeEntering) {
        const progress = Math.min(1, (time - state.pipeEnterStartedAt) / PIPE_ENTER_DURATION_MS);
        if (pipeBounds) {
          state.y = pipeBounds.top - playerSize + PLAYER_CONTACT_INSET + playerSize * PIPE_ENTER_DEPTH * progress;
        }
        state.velocityX = 0;
        state.velocityY = 0;
        if (progress >= 1) {
          state.pipeEnterStartedAt = 0;
          state.pipeEntryComplete = true;
          state.grounded = true;
          state.standingOn = "pipe";
          onEnterPipe?.();
        }
      } else if (state.pipeEntryComplete) {
        state.velocityX = 0;
        state.velocityY = 0;
      } else if (state.grounded) {
        const groundedPlatform = playerPlatforms.find(({ surface }) => surface === state.standingOn);
        state.y = groundedPlatform ? getPlatformPlayerY(groundedPlatform) : groundY;
        state.velocityY = 0;
      } else {
        state.velocityY += GRAVITY * delta;
        const previousBottom = state.y + playerSize;
        state.y += state.velocityY * delta;
        if (state.y < 0) {
          state.y = 0;
          state.velocityY = 0;
        }
        const currentBottom = state.y + playerSize;
        const landedPlatform = state.velocityY >= 0 && time >= state.dropThroughUntil
          ? playerPlatforms
              .filter(({ left: platformLeft, right: platformRight, top: platformTop }) =>
                state.x + playerSize * 0.65 > platformLeft &&
                state.x + playerSize * 0.35 < platformRight &&
                previousBottom <= platformTop &&
                currentBottom >= platformTop,
              )
              .sort((first, second) => first.top - second.top)[0]
          : undefined;
        if (landedPlatform) {
          state.y = getPlatformPlayerY(landedPlatform);
          state.velocityY = 0;
          state.grounded = true;
          state.standingOn = landedPlatform.surface;
        } else if (state.y >= groundY) {
          state.y = groundY;
          state.velocityY = 0;
          state.grounded = true;
          state.standingOn = "ground";
        }
      }

      if (time >= nextGhostAt && ghostsRef.current.filter((ghost) => ghost.hitAt === null).length < 2) {
        const lane = nextGhostId % 2;
        const spawnX = logicalWidth * (lane === 0 ? 0.18 : 0.82);
        ghostsRef.current.push({
          id: nextGhostId,
          x: spawnX,
          y: Math.min(
            Math.max(150, platformBounds.top - 92 - lane * 18),
            spawnX + ghostCollisionHalfWidth > platformBounds.left &&
              spawnX - ghostCollisionHalfWidth < platformBounds.right
              ? ghostPlatformMaxY
              : logicalHeight - 80,
          ),
          bornAt: time,
          hitAt: null,
          phase: nextGhostId * 1.7,
          lastTrailAt: time,
          trailSequence: 0,
        });
        nextGhostId += 1;
        nextGhostAt = time + GHOST_SPAWN_MS;
      }

      const playerCenterX = state.x + playerSize / 2;
      const playerCenterY = state.y + playerSize * 0.45;
      for (const ghost of ghostsRef.current) {
        if (ghost.hitAt !== null || time - ghost.bornAt < GHOST_MATERIALIZE_MS) continue;
        const deltaX = playerCenterX - ghost.x;
        const deltaY = playerCenterY - ghost.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance <= GHOST_STOP_DISTANCE) continue;
        const chaseStep = Math.min(GHOST_CHASE_SPEED * delta, distance - GHOST_STOP_DISTANCE);
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;
        const nextX = Math.max(40, Math.min(logicalWidth - 40, ghost.x + directionX * chaseStep));
        let nextY = Math.max(80, Math.min(logicalHeight - 80, ghost.y + directionY * chaseStep));
        const overlapsPlatform = nextX + ghostCollisionHalfWidth > platformBounds.left &&
          nextX - ghostCollisionHalfWidth < platformBounds.right;
        if (overlapsPlatform && ghost.y <= platformBounds.top) {
          nextY = Math.min(nextY, ghostPlatformMaxY);
        }
        ghost.x = nextX;
        ghost.y = nextY;

        if (time - ghost.lastTrailAt >= GHOST_TRAIL_INTERVAL_MS) {
          const sequence = ghost.trailSequence;
          const perpendicularX = -directionY;
          const perpendicularY = directionX;
          const lateralOffset = ((sequence % 5) - 2) * 5;
          const wakeDistance = 34 + (sequence % 3) * 8;
          ghostTrailRef.current.push({
            x: ghost.x - directionX * wakeDistance + perpendicularX * lateralOffset,
            y: ghost.y - directionY * wakeDistance + perpendicularY * lateralOffset,
            velocityX: -directionX * (12 + (sequence % 3) * 3) + perpendicularX * (sequence % 2 === 0 ? -4 : 4),
            velocityY: -directionY * (12 + (sequence % 3) * 3) - 5 + perpendicularY * (sequence % 2 === 0 ? -4 : 4),
            bornAt: time,
            lifetime: GHOST_TRAIL_LIFETIME_MS + (sequence % 4) * 70,
            symbol: GHOST_TRAIL_SYMBOLS[(ghost.id + sequence) % GHOST_TRAIL_SYMBOLS.length],
          });
          ghost.lastTrailAt = time;
          ghost.trailSequence += 1;
        }
      }

      ghostTrailRef.current = ghostTrailRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.velocityX * delta,
          y: particle.y + particle.velocityY * delta,
        }))
        .filter((particle) => time - particle.bornAt < particle.lifetime)
        .slice(-120);

      projectilesRef.current = projectilesRef.current
        .map((projectile) => ({ ...projectile, x: projectile.x + projectile.velocityX * delta }))
        .filter((projectile) => projectile.x > -32 && projectile.x < logicalWidth + 32);

      for (const projectile of projectilesRef.current) {
        const target = ghostsRef.current.find((ghost) => {
          if (ghost.hitAt !== null || time - ghost.bornAt < GHOST_MATERIALIZE_MS * 0.55) return false;
          const hoverY = ghost.y + Math.sin(time / 650 + ghost.phase) * GHOST_HOVER_AMPLITUDE;
          return Math.abs(projectile.x - ghost.x) < GHOST_HIT_HALF_WIDTH &&
            Math.abs(projectile.y - hoverY) < GHOST_HIT_HALF_HEIGHT;
        });
        if (target) {
          target.hitAt = time;
          projectile.x = -100;
        }
      }
      ghostsRef.current = ghostsRef.current.filter(
        (ghost) => ghost.hitAt === null || time - ghost.hitAt < GHOST_DISSOLVE_MS,
      );

      context.clearRect(0, 0, logicalWidth, logicalHeight);

      context.save();
      context.fillStyle = accentColor;
      context.font = `600 ${Math.max(10, Math.round(playerSize * 0.09))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      for (const particle of ghostTrailRef.current) {
        const progress = Math.min(1, (time - particle.bornAt) / particle.lifetime);
        context.globalAlpha = (1 - progress) * 0.8;
        context.fillText(particle.symbol, particle.x, particle.y);
      }
      context.restore();

      for (const ghost of ghostsRef.current) {
        const bornElapsed = time - ghost.bornAt;
        const hoverY = ghost.y + Math.sin(time / 650 + ghost.phase) * GHOST_HOVER_AMPLITUDE;
        const ghostFacing: 1 | -1 = playerCenterX >= ghost.x ? 1 : -1;
        if (ghost.hitAt !== null) {
          drawSheetFrame(
            "ghostDissolve",
            getArtFrame(theSceneArt.ghostDissolve, time - ghost.hitAt),
            ghost.x,
            hoverY,
            ghostScale,
          );
        } else if (bornElapsed < GHOST_MATERIALIZE_MS) {
          if (bornElapsed < GHOST_DATA_RING_MS) {
            drawSheetFrame(
              "ghostMaterialize",
              Math.min(1, getArtFrame(theSceneArt.ghostMaterialize, bornElapsed)),
              ghost.x,
              hoverY,
              ghostScale,
            );
          } else {
            const materializeProgress = Math.min(
              1,
              (bornElapsed - GHOST_DATA_RING_MS) / (GHOST_MATERIALIZE_MS - GHOST_DATA_RING_MS),
            );
            const easedProgress = 1 - Math.pow(1 - materializeProgress, 3);
            drawSheetFrame(
              "ghostFloat",
              0,
              ghost.x,
              hoverY,
              ghostScale * (0.9 + easedProgress * 0.1),
              ghostFacing,
              0.18 + easedProgress * 0.82,
            );
          }
        } else {
          drawSheetFrame(
            "ghostFloat",
            getArtFrame(theSceneArt.ghostFloat, bornElapsed - GHOST_MATERIALIZE_MS),
            ghost.x,
            hoverY,
            ghostScale,
            ghostFacing,
          );
        }
      }

      for (const projectile of projectilesRef.current) {
        drawSheetFrame(
          "projectile",
          getArtFrame(theSceneArt.projectile, time - projectile.createdAt),
          projectile.x,
          projectile.y,
          0.12,
          projectile.velocityX < 0 ? -1 : 1,
        );
      }

      const playerAnchorX = state.x + playerSize / 2;
      const playerAnchorY = state.y + playerSize;
      const isShooting = time - state.lastShotAt < SHOOT_POSE_MS;
      if (isMobileViewport) {
        // Mobile is a tap-only bot-clearing mode; keep the world visible without the avatar.
      } else if (!state.grounded) {
        if (isShooting) {
          const shootingFrameDrawn = drawSheetFrame(
            "airborneShoot",
            getArtFrame(theSceneArt.airborneShoot, time - state.lastShotAt),
            playerAnchorX,
            playerAnchorY,
            playerScale,
            state.facing,
          );
          if (!shootingFrameDrawn) {
            let fallbackFrame = getArtFrame(theSceneArt.airborne, time - state.airborneStartedAt);
            if (state.velocityY > 180) fallbackFrame = Math.max(3, fallbackFrame);
            drawSheetFrame("airborne", fallbackFrame, playerAnchorX, playerAnchorY, playerScale, state.facing);
          }
        } else {
          let frame = getArtFrame(theSceneArt.airborne, time - state.airborneStartedAt);
          if (state.velocityY > 180) frame = Math.max(3, frame);
          drawSheetFrame("airborne", frame, playerAnchorX, playerAnchorY, playerScale, state.facing);
        }
      } else if (isShooting) {
        const shootingFrameDrawn = drawSheetFrame(
          "shoot",
          getArtFrame(theSceneArt.shoot, time - state.lastShotAt),
          playerAnchorX,
          playerAnchorY,
          shootScale,
          state.facing,
        );
        if (!shootingFrameDrawn) {
          drawSheetFrame("idle", getArtFrame(theSceneArt.idle, time), playerAnchorX, playerAnchorY, playerScale, state.facing);
        }
      } else if (Math.abs(state.velocityX) > 8) {
        const elapsed = (state.walkDistance / MOVE_SPEED) * 1000;
        drawSheetFrame("run", getArtFrame(theSceneArt.run, elapsed), playerAnchorX, playerAnchorY, playerScale, state.facing);
      } else {
        drawSheetFrame("idle", getArtFrame(theSceneArt.idle, time), playerAnchorX, playerAnchorY, playerScale, state.facing);
      }

      canvas.dataset.playerX = state.x.toFixed(1);
      canvas.dataset.playerY = state.y.toFixed(1);
      canvas.dataset.playerSize = playerSize.toFixed(1);
      canvas.dataset.platformTop = platformBounds.top.toFixed(1);
      canvas.dataset.groundTop = groundTop.toFixed(1);
      const actionPlatformBounds = playerPlatforms.find(({ surface }) => surface === "action");
      canvas.dataset.actionPlatformTop = actionPlatformBounds?.top.toFixed(1) ?? "";
      canvas.dataset.surface = state.standingOn ?? "air";
      canvas.dataset.animation = !state.grounded
        ? isShooting ? "airborne-shoot" : "airborne"
        : isShooting
          ? "shoot"
          : Math.abs(state.velocityX) > 8
            ? "run"
            : "idle";
      canvas.dataset.projectiles = String(projectilesRef.current.length);
      canvas.dataset.ghosts = String(ghostsRef.current.length);
      canvas.dataset.materializingGhosts = String(
        ghostsRef.current.filter((ghost) => time - ghost.bornAt < GHOST_MATERIALIZE_MS).length,
      );
      canvas.dataset.ghostParticles = String(ghostTrailRef.current.length);
      const closestGhostPlatformClearance = ghostsRef.current.reduce((closest, ghost) => {
        const overlapsPlatform = ghost.x + ghostCollisionHalfWidth > platformBounds.left &&
          ghost.x - ghostCollisionHalfWidth < platformBounds.right;
        if (!overlapsPlatform || ghost.y > platformBounds.top) return closest;
        const hoverY = ghost.y + Math.sin(time / 650 + ghost.phase) * GHOST_HOVER_AMPLITUDE;
        return Math.min(closest, platformBounds.top - (hoverY + ghostBottomExtent));
      }, Infinity);
      canvas.dataset.ghostPlatformClearance = Number.isFinite(closestGhostPlatformClearance)
        ? closestGhostPlatformClearance.toFixed(1)
        : "";
      const closestGhostDistance = ghostsRef.current
        .filter((ghost) => ghost.hitAt === null)
        .reduce((closest, ghost) => Math.min(closest, Math.hypot(ghost.x - playerCenterX, ghost.y - playerCenterY)), Infinity);
      canvas.dataset.closestGhostDistance = Number.isFinite(closestGhostDistance)
        ? closestGhostDistance.toFixed(1)
        : "";
      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [onEnterPipe, spawnOnGround]);

  return (
    <canvas
      ref={canvasRef}
      width={896}
      height={192}
      aria-hidden="true"
      className={cn("scene-soldier pointer-events-none h-full w-full", className)}
    />
  );
}
