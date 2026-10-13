Ready to ship: yes. The controls hint uses a clear joystick glyph, the contribution legend is gone, and the layout remains intact at both reviewed widths.

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
- Accessibility tree: checked at both widths; the decorative joystick is hidden from assistive technology and the full keyboard instruction remains readable.
- Automated WCAG scan: not run because this browser surface prevents the scanner from attaching to its immutable page global.
- Component specs: not checked; this change does not introduce or alter a Lime component.

## Summary

The joystick creates a clearer relationship between the keyboard hint and the playable character. Removing the intensity legend simplifies the contribution card without removing the graph itself. The hint remains centered and legible, wrapping to two lines at 390 px.

## Findings

None.

## Edge cases not shown

- Empty, loading, error, partial-data, offline, permission, and success states are not part of this static landing-page adjustment.
- Long translated instruction copy was not shown.
- Reduced-motion behavior was not rechecked because this change adds no motion.

## For a person to decide

None.

## Left out

None.

Coverage: `/` at 390 × 844 and 1280 × 900 in the default theme; horizontal overflow and console errors checked. Interactive gameplay states were not re-reviewed.
