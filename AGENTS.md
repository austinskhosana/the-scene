# The Scene

The Scene is a React/TypeScript product UI with a playable landing page. The game is intentionally small: ordinary DOM/CSS UI becomes level geometry, while the player, ghosts, projectiles, and effects are drawn in a canvas overlay.

## Start here

- Use Node.js `>=22.13.0` (`.nvmrc` is provided).
- Install with `npm install`.
- Run with `npm run dev` and open `/`.
- The isolated canvas demo is at `/playground`.
- Validate with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Game map

- `app/page.tsx`: landing DOM, product UI, and platform markers.
- `components/game/landing-soldier.tsx`: landing game lifecycle, simulation loop, and canvas rendering.
- `components/game/scene-playground.tsx`: intentionally separate, simpler canvas demo.
- `lib/game/landing-game-config.ts`: safe gameplay tuning values.
- `lib/game/platforms.ts`: DOM platform discovery and DOM-to-canvas coordinates.
- `lib/game/the-scene-art.ts`: normalized sprite-strip metadata.
- `public/game/the-scene/normalized/`: runtime sprite strips.

Keep high-frequency gameplay state in refs/plain objects, not React state. Preserve the product UI when changing gameplay unless the request explicitly includes UI changes.

## Adding a platform

Mark an ordinary element with `data-game-platform`. The standard platform contract is handled in `lib/game/platforms.ts`. Named surfaces (`data-streak-platform`, `data-action-platform`, `data-pipe-platform`, and `data-ground-platform`) retain special landing-page behavior.

## Adding mechanics

Start with `lib/game/landing-game-config.ts` for feel/timing changes. Then inspect the matching section in `landing-soldier.tsx`: input, player movement/collision, ghosts, projectiles, or rendering. Do not introduce a game engine or broad abstraction for a single mechanic.

## Assets

Replace normalized sprite strips in `public/game/the-scene/normalized/` and update the matching definition in `lib/game/the-scene-art.ts`. Preserve frame order, cell dimensions, FPS, loop behavior, and anchor values unless intentionally changing the renderer.
