Status: complete (partial: automated accessibility scan unavailable in the selected browser runtime)
Commit: none

The airborne shooting interaction is ready for this scoped change.
Ready to ship: yes. The character can shoot while airborne at both reviewed widths, returns to the normal airborne state, and accepts another shot without interrupting movement (blocking 0, should-fix 0, note 0, 0 accessibility questions for a person).

## Review record

- Source: local build at `http://localhost:3000/`
- Tool: Codex in-app browser
- Viewports: 390×844 and 1280×900
- Date: 2026-10-10
- Criteria: Lime rules and `ui-review/references/review-criteria.md`
- Pass: first pass
- Given purpose: let the character shoot while jumping or falling without interrupting movement physics.
- Captures: `2026-10-10-airborne-shooting-390.png`, `2026-10-10-airborne-shooting-1280.png`
- Lint: `npx eslint -c lime.eslint.config.mjs .`, exit 0
- Build: `npm run build`, exit 0
- Accessibility scan: not run; the selected browser runtime did not expose an automated scan.

## Summary

The new four-frame state keeps the established character scale and bottom-center anchor. The third frame releases the projectile. At both widths the canvas matched the viewport width with no horizontal overflow. After the 500 ms shot sequence, animation returned to `airborne`; a second mid-air shot entered `airborne-shoot` and released one projectile. No browser warnings or errors were recorded.

## Findings

None.

## Edge cases not shown

- Empty, loading, error, partial data, permissions, offline: not applicable to the local canvas interaction.
- Long or short content: not affected by this change.
- First use and returning user: initial reset and repeated airborne shooting shown; persisted-session differences not applicable.
- Touch input: keyboard interaction only; the landing page currently documents keyboard controls.
- Reduced motion and throttled CPU: not shown.

## For a person to decide

None.

## Left out

- Character movement over the heading was not reported because free movement across the landing-page space is intentional product behavior.

Coverage: `/` at 390×844 and 1280×900, light theme; initial airborne shot, return to airborne state, repeated airborne shot, projectile release, overflow, and console logs measured. Automated accessibility scan, reduced motion, and CPU throttling were not measured.
