export const THE_SCENE_ART_ROOT = "/game/the-scene/normalized";

export const theSceneArt = {
  idle: {
    src: `${THE_SCENE_ART_ROOT}/player-idle.png`,
    frames: 4,
    cellWidth: 384,
    cellHeight: 480,
    anchorX: 192,
    anchorY: 456,
    fps: 4,
    loop: true,
  },
  walk: {
    src: `${THE_SCENE_ART_ROOT}/player-walk.png`,
    frames: 8,
    cellWidth: 384,
    cellHeight: 480,
    anchorX: 192,
    anchorY: 456,
    fps: 10,
    loop: true,
  },
  run: {
    src: `${THE_SCENE_ART_ROOT}/player-run.png`,
    frames: 8,
    cellWidth: 384,
    cellHeight: 480,
    anchorX: 192,
    anchorY: 456,
    fps: 12,
    loop: true,
  },
  airborne: {
    src: `${THE_SCENE_ART_ROOT}/player-airborne.png`,
    frames: 6,
    cellWidth: 384,
    cellHeight: 512,
    anchorX: 192,
    anchorY: 488,
    fps: 10,
    loop: false,
  },
  shoot: {
    src: `${THE_SCENE_ART_ROOT}/player-shoot.png`,
    frames: 6,
    cellWidth: 272,
    cellHeight: 480,
    anchorX: 136,
    anchorY: 456,
    fps: 12,
    loop: false,
  },
  airborneShoot: {
    src: `${THE_SCENE_ART_ROOT}/player-airborne-shoot.png`,
    frames: 4,
    cellWidth: 384,
    cellHeight: 512,
    anchorX: 192,
    anchorY: 488,
    fps: 8,
    loop: false,
  },
  projectile: {
    src: `${THE_SCENE_ART_ROOT}/energy-projectile.png`,
    frames: 8,
    cellWidth: 256,
    cellHeight: 256,
    anchorX: 128,
    anchorY: 128,
    fps: 12,
    loop: true,
  },
  ghostFloat: {
    src: `${THE_SCENE_ART_ROOT}/ghost-float.png`,
    frames: 1,
    cellWidth: 320,
    cellHeight: 480,
    anchorX: 160,
    anchorY: 240,
    fps: 1,
    loop: true,
  },
  ghostMaterialize: {
    src: `${THE_SCENE_ART_ROOT}/ghost-materialize.png`,
    frames: 10,
    cellWidth: 320,
    cellHeight: 480,
    anchorX: 160,
    anchorY: 240,
    fps: 10,
    loop: false,
  },
  ghostDissolve: {
    src: `${THE_SCENE_ART_ROOT}/ghost-hit-dissolve.png`,
    frames: 8,
    cellWidth: 320,
    cellHeight: 480,
    anchorX: 160,
    anchorY: 240,
    fps: 12,
    loop: false,
  },
} as const;

export type TheSceneArtName = keyof typeof theSceneArt;
export type TheSceneArtDefinition = (typeof theSceneArt)[TheSceneArtName];

export function getArtFrame(definition: TheSceneArtDefinition, elapsedMs: number) {
  const elapsedFrames = Math.floor((Math.max(0, elapsedMs) / 1000) * definition.fps);
  return definition.loop
    ? elapsedFrames % definition.frames
    : Math.min(elapsedFrames, definition.frames - 1);
}
