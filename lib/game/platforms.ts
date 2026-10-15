export type GamePlatformName = "streak" | "action" | "pipe" | "ground" | "generic";

export type GamePlatformBounds = {
  surface: GamePlatformName;
  left: number;
  right: number;
  top: number;
};

/**
 * Add data-game-platform to ordinary UI to make it discoverable by the game.
 * Named attributes preserve the landing page's special surfaces.
 */
export const GAME_PLATFORM_SELECTORS = {
  all: "[data-game-platform]",
  streak: "[data-streak-platform]",
  action: "[data-action-platform]",
  pipe: "[data-pipe-platform]",
  ground: "[data-ground-platform]",
} as const;

type PlatformElement = HTMLElement & { dataset: DOMStringMap };

export function getPlatformBounds(
  element: PlatformElement | null,
  canvasBounds: DOMRect,
  fallback: Pick<GamePlatformBounds, "left" | "right" | "top">,
) {
  const bounds = element?.getBoundingClientRect();
  if (!bounds) return fallback;

  return {
    left: bounds.left - canvasBounds.left,
    right: bounds.right - canvasBounds.left,
    top: bounds.top - canvasBounds.top,
  };
}

export function discoverGamePlatforms(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
  const parent = canvas.parentElement;
  const elements = {
    streak: parent?.querySelector<PlatformElement>(GAME_PLATFORM_SELECTORS.streak) ?? null,
    action: parent?.querySelector<PlatformElement>(GAME_PLATFORM_SELECTORS.action) ?? null,
    pipe: parent?.querySelector<PlatformElement>(GAME_PLATFORM_SELECTORS.pipe) ?? null,
    ground: parent?.querySelector<PlatformElement>(GAME_PLATFORM_SELECTORS.ground) ?? null,
  };
  const genericElements = Array.from(parent?.querySelectorAll<PlatformElement>(GAME_PLATFORM_SELECTORS.all) ?? [])
    .filter((element) => !element.matches(`${GAME_PLATFORM_SELECTORS.streak}, ${GAME_PLATFORM_SELECTORS.action}, ${GAME_PLATFORM_SELECTORS.pipe}, ${GAME_PLATFORM_SELECTORS.ground}`));

  const measure = () => {
    const canvasBounds = canvas.getBoundingClientRect();
    const fallback = {
      left: 0,
      right: canvasBounds.width || logicalWidth,
      top: (canvasBounds.height || logicalHeight) * 0.72,
    };
    const platforms: GamePlatformBounds[] = [
      ...(elements.action ? [{ surface: "action" as const, ...getPlatformBounds(elements.action, canvasBounds, fallback) }] : []),
      ...(elements.streak ? [{ surface: "streak" as const, ...getPlatformBounds(elements.streak, canvasBounds, fallback) }] : []),
      ...(elements.pipe ? [{ surface: "pipe" as const, ...getPlatformBounds(elements.pipe, canvasBounds, fallback) }] : []),
      ...genericElements.map((element) => ({
        surface: "generic" as const,
        ...getPlatformBounds(element, canvasBounds, fallback),
      })),
    ];
    return { elements, platforms, ground: getPlatformBounds(elements.ground, canvasBounds, fallback) };
  };

  return { elements, measure };
}
