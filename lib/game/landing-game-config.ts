/** The small set of values that control how the landing game feels. */
export const landingGameConfig = {
  player: {
    moveSpeed: 180,
    moveAcceleration: 960,
    moveDeceleration: 1240,
    jumpSpeed: 1200,
    gravity: 1500,
    contactInset: 3,
    lowerLevelContactInset: 7,
  },
  shooting: {
    poseDurationMs: 500,
    releaseDelayMs: 250,
    projectileSpeed: 660,
    scaleCorrection: 444 / 303,
    muzzleOffsetX: 106,
    muzzleOffsetY: -242,
    airborneMuzzleOffsetX: 174,
    airborneMuzzleOffsetY: -350,
  },
  pipe: {
    enterDurationMs: 650,
    enterDepth: 1.05,
    centerTolerance: 0.22,
  },
  ghost: {
    materializeMs: 1000,
    dataRingMs: 220,
    dissolveMs: 680,
    firstSpawnDelayMs: 1800,
    spawnIntervalMs: 6500,
    chaseSpeed: 52,
    stopDistance: 82,
    visibleHeight: 340,
    hoverAmplitude: 10,
    boundingPadding: 12,
    platformClearance: 8,
    hitHalfWidth: 64,
    hitHalfHeight: 96,
    trailIntervalMs: 74,
    trailLifetimeMs: 920,
  },
  playerSize: { min: 108, max: 132, widthRatio: 0.16 },
  projectile: { displayScale: 0.12, boundsPadding: 32 },
  ghostTrail: { maxParticles: 120 },
} as const;

export const GHOST_TRAIL_SYMBOLS = ["0", "1", "+", "*", "/", "#", "@", "?"] as const;

