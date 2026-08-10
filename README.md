# Super Drain

T4H Super Drain is a browser-local intelligence recovery tool for preserving occurrences and extracting ideas, unfinished work, opportunity costs, intended outputs and next actions.

## Runtime

- Static browser application; no server runtime is required.
- Local persistence uses IndexedDB (`t4h-super-drain`) with a localStorage fallback for reads.
- ZIP extraction uses JSZip 3.10.1 from jsDelivr.
- Analysis, SHA-256 hashing, receipt generation and CSV export run in the browser.
- The production Vercel deployment is the recovery baseline for this repository.

## Files

- `index.html` — application shell.
- `app-v2.mjs` — UI, ingestion, reporting and DRAIN controller.
- `engine.mjs` — extraction, analysis, hashing and report/CSV logic.
- `storage.mjs` — local persistence.
- `styles.css` — UI styling.
- `tests/engine-smoke.mjs` — deterministic engine smoke test.

## Test

```bash
npm test
```

The repository is intentionally framework-free. Vercel can serve the root as a static deployment.
