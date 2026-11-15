# Crew wellbeing frontend

The user approved the preceding frontend proposal with “creala”. Build its complete demo flow in the existing Website directory.

## Intent
Shared crew screen that makes changes visible before a person has to request help. Four fictional crew identities use persistent geometric symbols; three category buttons always occupy the same overview positions. Opening a crew member prioritizes review items; opening a metric exposes its trend, provenance, quality, timestamp and evidence. A short check-in records an action locally without clearing the observation.

## Design
80s instrument panel: warm paper, ink blue panels, cream numerals, royal blue selection, restrained multicolor stripes. Use supplied brand logo and Phosphor geometric icons matching the user's triangle/circle/square/umbrella sketch. Exact geometric symbols are functional identity markers, not decorative raster artwork. Visible UI in English as requested by project documentation; documents in Spanish/English.

## Scope and constraints
React/Vite/TypeScript/Recharts. Existing template runtime retained. Synthetic fixtures only; no clinical thresholds or probability of illness, no AI/network/sensor claims. Three semantic levels plus unknown technical state. Missing/stale inputs do not show as healthy. Local journal is for fictional demo observations only. No live medical integrations or new backend. All data adapter boundaries remain explicit for the team.

## Approaches
Selected: overview plus individual view and metric panel. A full metrics wall sacrifices distant readability; separate pages for every metric add navigation cost. The selected approach preserves crew context and exposes detail on demand.

## Acceptance
Crew > category > metric > check-in > saved journal works. Overview, journal and settings navigation work. Time range changes charts. Offline-demo state stays separate from observation severity. Keyboard access and reduced motion supported. Build, state tests and browser walkthrough pass. No publish or merge to main.
