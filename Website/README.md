# Crew wellbeing frontend

React + Vite + TypeScript frontend for Error en Capa 8. The visual direction follows the team's four-symbol sketch and warm 80s instrument-panel references.

## Run locally

Requires Node.js 22 or newer.

```bash
cd Website
npm ci
npm run dev
```

Open the local URL printed by Vite. To expose the development server on a trusted local network, use `npm run dev -- --host 0.0.0.0`.

```bash
npm test
npm run build
npm run test:sites
```

The production client is in `dist/client`. The template also prepares optional hosting packaging in `dist/server` and `dist/.openai`; no hosting is needed to run locally.

## Demo walkthrough

1. Open Alex Morgan's triangle. Recovery is prioritized.
2. Open Heart rate variability. Change 24h / 7d / 30d and expand the research context.
3. Record a check-in, choose how the fictional astronaut feels and a planned follow-up.
4. Open Mission journal. Reload and return to the journal: the check-in persists locally.
5. Open Noor Patel's adaptation category to inspect a missing sample. Select 30d for historical measurements.
6. In Demo controls, turn off the simulated ground link. The local demo continues.

All four people, values, references and flags are fictional. Status is fixture metadata, not a clinical inference or AI disease probability. There is no live sensor, NASA dataset, JEV, System One, or backend connection. No data is transmitted by the app. External research links open only when selected.

## Files to extend

- `src/data.ts`: typed synthetic fixtures and measurement inventory based on the team's CSV. Replace this boundary with an API adapter when the backend exists.
- `src/model.ts`: presentation-state aggregation, prioritization and validated journal parsing.
- `src/App.tsx`: crew overview, personal review, indicator dialog, check-in and local journal.
- `src/components.tsx`: reusable crew symbols, categories and status marks.
- `src/charts.tsx`: Recharts trends, reference overlays and missing-sample state.
- `src/app.css`: editable visual tokens and responsive layouts; fonts are self-hosted.

The journal uses the versioned key `error-capa8-demo-journal-v1`. Use fictional information only. If browser storage is unavailable, entries stay in session and the interface says so. Recording a follow-up never clears telemetry flags. The ground-link switch simulates a remote uplink loss; it is not a service worker or a claim that a fresh page can load without a running local server.

## Measurement distinctions

- Skin temperature is not core body temperature.
- Blood pressure is an explicitly simulated, unvalidated ECG/PPG estimate.
- Biological markers use sparse sample histories; missing current samples remain unknown.
- Radiation is displayed as an unconnected dedicated-dosimeter source, never inferred from cortisol.
- Rest duration is an optional demonstration log added to support the recovery scenario.
- NASA HRP links provide research context, not validation of these fixture flags.
