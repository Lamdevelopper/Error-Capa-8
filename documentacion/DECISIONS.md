# Product decisions · 2026-11-14

- The user's current brief and approved frontend proposal supersede older individual-only overview layouts: the first screen is shared crew status with four geometric identities.
- The initial delivery is a frontend-only synthetic demo in the existing `Website` directory. React/Vite/TypeScript/Recharts and self-hosted fonts; no new backend or infrastructure.
- Three category states (steady/review/priority) plus a distinct unknown state for missing or stale data. Fixture states are illustrative, not clinical thresholds.
- Check-ins record context and planned follow-up locally; they never resolve an observation automatically.
- Radiation requires a dedicated dosimeter source. The supplied CSV's cortisol/immune/radiation association is not implemented as a measurement inference.
- JEV/System One and actual sensor access remain unconnected, explicitly stated in the app's evidence and demo controls.
