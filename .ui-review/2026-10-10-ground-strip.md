# Ground strip UI review

## Scope

- Screen: landing page at `/`
- Change: supplied pixel-art grass and soil strip used as the physical page ground
- Source: local development build

## Checks

- Desktop: 1280 × 900
- Mobile: 390 × 844
- Horizontal overflow: none at either width
- Character collision: player settles at the grass surface (`playerY 630 + playerSize 132 = groundTop 762` at desktop)
- Layering: character and streak card remain above the ground artwork
- Asset rendering: nearest-neighbor pixel rendering, full-width crop, no transparent gap above the grass
- Console: no relevant errors observed
- Lime lint: pass
- Production build: pass

## Findings

No blocking or high-severity issues found. At mobile width the card ends at the grass line, producing a deliberate platform-to-ground handoff without covering card content. The page remains scrollable because its content is taller than the viewport; the ground stays at the true page bottom rather than floating over content.

## Evidence

- `2026-10-10-ground-strip-1280.png`
- `2026-10-10-ground-strip-player-1280.png`
- `2026-10-10-ground-strip-390.png`
