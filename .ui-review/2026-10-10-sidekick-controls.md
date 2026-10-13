Ready to ship: yes. The requested Sidekick gamepad, restored contribution legend, and external controls hint are clear at both reviewed widths.

Ship: yes. No blocking or should-fix findings; no accessibility questions require a product decision.

## Review record

- Status: complete (blocking 0, should-fix 0, note 0)
- Commit: none
- Source: local landing page at `http://localhost:3000/`
- Tool: in-app browser
- Viewports: 390 × 844 and 1280 × 900
- Date: 2026-10-10
- Criteria: Lime design-system rules and `ui-review/references/review-criteria.md`
- Purpose, assumed: introduce The Scene and let a visitor begin tracking a manual X replying habit.
- Lint: `npx eslint -c lime.eslint.config.mjs .` — exit 0
- Build: `npm run build` — exit 0
- Automated WCAG scan: not run; the browser surface does not expose an accessibility scanner.
- Component specs: not checked; this change does not alter a Lime component API.

## Summary

The solid gamepad clearly labels the gameplay directions. The contribution intensity legend is restored inside the card, while the directions sit 12 px below the card as a separate centered line. The mobile layout was raised slightly so the directions remain above the ground artwork with no horizontal overflow.

## Findings

None.

## Edge cases not shown

- Empty, loading, error, partial-data, offline, permission, and success states are outside this static landing-page adjustment.
- Long translated directions were not shown.
- Reduced motion was not rechecked because this change adds no motion.

## For a person to decide

None.

## Left out

None.

Coverage: `/` at 390 × 844 and 1280 × 900 in the default theme; horizontal overflow, icon rendering, card-to-hint spacing, and ground clearance measured. Gameplay interactions were not re-reviewed.
