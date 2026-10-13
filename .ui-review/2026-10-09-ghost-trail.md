Status: complete (blocking 0, should-fix 0, note 0)
Commit: none

The revised ghost treatment is ready for this iteration.
Ready to ship: yes. The stable enemy is slightly larger than the player and leaves a readable, fading ASCII wake at both reviewed widths; 0 accessibility questions for a person.

## Review record

- Source: local `/` route at `http://localhost:3000/`
- Tool: Codex in-app browser
- Viewports: 390 × 844 and 1280 × 900
- Date: 2026-10-09
- Criteria: Lime design system rules, then `ui-review/references/review-criteria.md`
- Pass: follow-up visual review
- Purpose, given: show a stable floating holographic enemy, slightly larger than the player, with ASCII particles trailing behind its movement.
- Captures: `2026-10-09-ghost-trail-390.png`, `2026-10-09-ghost-trail-1280.png`
- Lint: `npx eslint -c lime.eslint.config.mjs .`
- Accessibility scan: automated WCAG scan not exposed by the selected browser; the accessibility tree was inspected and the canvas remains decorative with `aria-hidden="true"`.

## Summary

The ghost is now visually comparable to the player rather than reading as a miniature. Its body remains stable while a separate lime data wake follows its direction of travel and fades with distance. The slightly smaller artwork uses an independently enlarged collision envelope and maintains about 20 px of visible clearance above the streak platform throughout its hover cycle, so the tail no longer clips behind the card. The effect stays inside the game layer and does not compete with the primary action.

## Findings

None.

## Edge cases not shown

- Empty, loading, error, partial data, permissions, offline, and save confirmation: not applicable to this decorative game-layer change.
- Long and short content: not affected by this change.
- First use and returning user: same animation behavior.
- Touch: the canvas is non-interactive and pointer-transparent.
- Reduced motion and throttled CPU: not measured in this focused pass.

## For a person to decide

None.

## Left out

None.

Coverage: `/` at 390 and 1280 in the light Lime theme; ghost spawn, chase, relative scale, platform clearance, particle count, horizontal overflow, accessibility tree, and browser console measured. Reduced-motion and CPU-throttling probes were not run.
