import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the landing page exposes the playable UI contract", async () => {
  const page = await source("app/page.tsx");
  assert.match(page, /<LandingSoldier/);
  assert.match(page, /data-game-platform/);
  assert.match(page, /data-streak-platform/);
  assert.match(page, /data-action-platform/);
  assert.match(page, /data-ground-platform/);
});

test("game configuration and platform discovery are explicit", async () => {
  const config = await source("lib/game/landing-game-config.ts");
  const platforms = await source("lib/game/platforms.ts");
  assert.match(config, /moveSpeed/);
  assert.match(config, /jumpSpeed/);
  assert.match(config, /projectileSpeed/);
  assert.match(platforms, /GAME_PLATFORM_SELECTORS/);
  assert.match(platforms, /getBoundingClientRect/);
  assert.match(platforms, /data-game-platform/);
});

test("the runtime sprite metadata points at normalized game assets", async () => {
  const art = await source("lib/game/the-scene-art.ts");
  assert.match(art, /\/game\/the-scene\/normalized/);
  for (const asset of ["player-idle.png", "player-run.png", "ghost-float.png", "energy-projectile.png"]) {
    await access(new URL(`public/game/the-scene/normalized/${asset}`, root));
  }
});
