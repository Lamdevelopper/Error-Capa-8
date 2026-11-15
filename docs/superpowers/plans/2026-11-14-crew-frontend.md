# Crew Frontend Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** A usable 80s crew wellbeing frontend with a complete synthetic-data review flow.
**Architecture:** Frontend-only typed fixtures and presentation state, chart components, local demo journal. Existing Website runtime retained.
**Tech Stack:** React, Vite, TypeScript, Recharts, Phosphor, Vitest.
**Spec:** docs/superpowers/specs/2026-11-14-crew-frontend-design.md

## Global Constraints
- Synthetic fixtures only; no diagnostic claims or live integration claims.
- Unknown state is separate from the three health observation states.
- Stored demo actions never clear telemetry observations.
- Existing non-frontend files and shared main branch remain unchanged.

## Review Focus
- Missing signals: never nominal.
- Damaged local storage: usable journal fallback.
- Direct category entry: opens correct crew and category.
- Record action: survives reload and leaves observation in place.
- Small viewport and keyboard: no hidden critical controls.

### Task 1: Typed presentation model and fixtures
Files: src/model.ts, src/model.test.ts, src/data.ts.
- [x] Run model tests before implementation; verify expected failure.
- [x] Implement categoryStatus, prioritizeCategories, journal validation and append functions.
- [x] Add reproducible fictional crew/metric data with explicit source and freshness.
- [x] Run npm test.

### Task 2: Frontend and complete interaction flow
Files: src/App.tsx, src/components.tsx, src/charts.tsx, src/app.css.
- [x] Build shared overview and individual categories in fixed overview order.
- [x] Add metric chart, evidence, time controls and guided check-in dialog.
- [x] Add local journal, demo settings, responsive layout and keyboard behavior.
- [x] Run npm test and npm run build.

### Task 3: Verify and deliver
Files: design-qa.md, README.md, frontend decision record.
- [x] Start preview; inspect overview, individual and metric states in cloud browser. Direct desktop loopback used after terminal.local ingress failure.
- [x] Complete check-in, reload and confirm persisted journal; inspect offline state.
- [x] Verify contrast, clipping, dialogs, keyboard and narrow layout; fix defects.
- [x] Run full checks, commit feature branch, upload through the GitHub connector and create draft pull request #1.

Delivered: https://github.com/Lamdevelopper/Error-Capa-8/pull/1
