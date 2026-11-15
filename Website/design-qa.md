# Frontend visual and interaction QA

Date: 2026-11-14 (Mexico City). Scope: the approved crew-screen proposal, not a pixel clone of a single reference image.

## Visual truth and captures

- Source layout: user sketch `imagen(20261115-001325).png`, 819 × 1456 px, supplied in this conversation.
- Source art direction: user widget reference `imagen(20261115-001329).png`, 1344 × 896 px; Flow/retro moodboard also supplied. Existing brand assets in `documentacion/visual/`.
- The source references describe different layouts. The approved proposal resolves the implementation: four crew tiles, persistent geometric identity, three category buttons, individual review and functional metric charts.
- Full-view comparison: `docs/frontend/screenshots/comparison.jpg`, combining the actual sketch, widget reference, overview and individual captures in one visual input.
- Browser viewport: 1363 × 936 CSS px at 100% zoom. Full-page overview: 1348 × 1021 px; individual and metric-dialog captures: 1363 × 936 px. These are browser-rendered captures. No density normalization was needed for the desktop comparison; source references were proportionally fitted into the comparison board and were not treated as a pixel-exact full-screen mock.
- Focused comparison: supplied widget reading/chart anatomy versus the individual metric cards and `indicator.jpg`. Cream numerical hierarchy, ink panels, readable axes and semantically colored borders are retained; sparse assay samples remain points rather than artificial live telemetry.
- Narrow check: Chrome zoom produced a 454 × 312 CSS viewport; document scroll width was 449 px, with no horizontal overflow. `narrow-overview.jpg` is the browser API's additionally downsampled 150 × 540 full-page capture; this is supporting evidence only, not a 1:1 typography comparison.

## Required visual surfaces

- Fonts: self-hosted Space Grotesk and IBM Plex Mono. Bold display hierarchy and technical labels follow the retro references; text is selectable. No clipped crew names or modal titles in the checked desktop state.
- Layout: the four symbols and three fixed category positions match the sketch. Individual review preserves the symbol while prioritizing flagged categories. Cards, modal padding and navigation align consistently; the 454px layout becomes one column.
- Colors: warm paper, navy panels and cream readings; blue selection, with distinct green/yellow/coral/gray statuses. State also has icon and text. Thin identity-colored card edges provide restrained retro accent bands.
- Assets: supplied fingerprint logo retained; standard Phosphor symbols implement the geometric identities requested by the team. Charts are functional Recharts data visualizations, not raster illustrations.
- Copy: visible UI in English per project documentation. Fictional data and crew are identified; no AI, sensor or medical validation is claimed. Skin temperature, simulated pressure estimates, missing samples and unconnected dosimetry are distinguished.

## Functional checks

- Overview → Alex → prioritized Recovery → HRV metric → 24h/7d/30d.
- Guided check-in saves feeling and planned follow-up. Journal survives a page reload; the original review observation remains.
- Two tabs opened from the same saved state: sequential A/B check-ins both remain after reload (three journal entries including the earlier test record).
- Missing sample: Noor → Adaptation. Osteocalcin has no current-week sample; 30d shows history ending D076. Missing is not steady.
- Simulated ground-link loss: banner appears; local crew and journal remain available. This does not claim service-worker offline reload.
- Evidence/source navigation and the two-person needs-review filter work.
- Dialog Escape dismissal and native modal focus behavior checked. Clicking the interior padding now preserves entered draft text.
- Cortisol 24h explicitly checked after the reference fix: one reference line and one reference area rendered even though the personal reference is outside the sample-only range.
- No application errors after the final fixes. Two transient Recharts zero-dimension warnings were observed while a dialog mounted/closed; visible charts subsequently sized and rendered correctly. Browser-extension metadata errors were unrelated to the app and excluded. Raw post-fix log: `docs/frontend/screenshots/console.json`.

## Comparison and fix history

1. Code/data pass: corrected displayed-current versus final-chart-sample mismatch and moved the overdue sample out of the current week. Regression tests fail before and pass after the fixes.
2. Independent review: fixed dialog padding dismissal, disappearing reference overlays, stale-tab journal overwrites and ambiguous systolic-only history labeling. Browser retests confirmed draft retention, visible reference overlays and multi-tab persistence.
3. Final visual comparison: no remaining actionable P0/P1/P2 differences relative to the approved concept. Review is concept fidelity because the references intentionally describe separate compositions.

## Verification and limits

- `npm test`: 9 state/journal/data tests pass.
- `npm run build`: TypeScript and Vite production build pass.
- `npm run test:sites`: 4 packaging/worker tests pass.
- Live preview verified through the cloud browser using the desktop's direct loopback URL after the terminal.local ingress failed. The verified tab is preserved for review.
- Backend, live hardware, AI integration and real medical rules remain outside this frontend delivery.
- Follow-up polish (P3): chart-library chunk is about 203 kB gzipped; lazy loading can reduce initial loading. Physical wall-display viewing distance and real sensor typography should be tested on the team's final display.

final result: passed
