export const SCENE_SOLDIER_SHEET = "/game/scene-soldier-02-alternating-run.png";

export const SCENE_SOLDIER_GRID = {
  columns: 8,
  rows: 5,
} as const;

// The generated artwork slightly overlaps the row above in a few cells. Cropping this
// transparent gutter keeps neighboring poses out without changing the source bitmap.
export const SCENE_SOLDIER_ROW_GUTTER = 12;
export const SCENE_SOLDIER_COLUMN_GUTTER = 12;

export const sceneSoldierAnimations = {
  idle: { row: 0, frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 5, loop: true },
  // A complete gait: left-foot contact through lift, then the matching right-foot sequence.
  run: { row: 1, frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 11, loop: true },
  jump: { row: 2, frames: [0, 1, 2, 3], fps: 10, loop: false },
  fall: { row: 2, frames: [4], fps: 1, loop: false },
  land: { row: 2, frames: [5, 6, 7], fps: 10, loop: false },
  shoot: { row: 3, frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 14, loop: false },
  hit: { row: 4, frames: [0, 1, 2, 3, 4], fps: 10, loop: false },
  recover: { row: 4, frames: [5, 6, 7], fps: 8, loop: false },
} as const;

export type SceneSoldierAnimation = keyof typeof sceneSoldierAnimations;

export function getSceneSoldierFrame(animation: SceneSoldierAnimation, elapsedMs: number) {
  const definition = sceneSoldierAnimations[animation];
  const elapsedFrames = Math.floor((elapsedMs / 1000) * definition.fps);
  const frameIndex = definition.loop
    ? elapsedFrames % definition.frames.length
    : Math.min(elapsedFrames, definition.frames.length - 1);

  return {
    column: definition.frames[frameIndex],
    row: definition.row,
  };
}
