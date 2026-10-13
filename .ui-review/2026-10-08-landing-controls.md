Status: complete (partial: automated WCAG scan was unavailable in the connected browser surface)
Commit: none

Ready to ship within the reviewed scope: yes. The taller streak graph fits both tested viewports, the character stays on the platform edge, and all requested keyboard controls respond.

## Review record

- Source: `http://localhost:3000/`
- Viewports: 390 by 844 and 1280 by 900
- Date: 2026-10-08
- Criteria: Lime design-system rules, then `review-criteria.md`
- Pass: follow-up after increasing the streak card height and adding character controls
- Given purpose: show the interactive character in context on the product's contribution streak
- Captures: `2026-10-08-landing-controls-390.png`, `2026-10-08-landing-controls-1280.png`
- Lint: `npx eslint -c lime.eslint.config.mjs .` exited 0
- Build: `npm run build` exited 0
- Gap: automated WCAG A and AA scan not run because script injection is not available in the connected browser surface

## Summary

The contribution card now follows the dashboard hierarchy and shows a seven-row yearly grid. The character canvas is focusable, announces its controls through the visible instruction, and keeps its feet at the card edge. The primary CTA remains the only glowing action.

## Findings

None.

## Edge cases not shown

- Loading, error, offline, and partial-data states are not applicable to this static landing composition.
- Long translated copy, reduced motion, and a physical touch device were not shown.
- The graph's horizontally scrolled end state was not captured on phone.

## For a person to decide

None.

## Left out

None.

Coverage: `/` at 390 and 1280 widths in the light theme; measured viewport fit, horizontal overflow, character-to-platform contact, right-arrow movement, jump, and shooting. Movement changed x from 28.6 to 39.4, jump entered the `jump` state, and shooting entered the `shoot` state with one projectile. Automated WCAG scan, dark theme, and physical-device touch behavior were not reviewed.
