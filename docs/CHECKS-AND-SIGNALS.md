# Checks and Signals

This document describes the currently implemented check system in this repository.

## Purpose

The check system separates:

- contract health of this repo's schemas and fixtures
- observed upstream CLI behavior drift
- metadata synchronization for the Known Deviations snapshot context

## Implemented Checks

### 1) Contract CI (blocking)

- Workflow: `.github/workflows/ci.yml`
- Command: `npm run validate:fixtures`
- Meaning:
  - pass: fixtures and schemas are internally coherent
  - fail: this repo's contract is inconsistent and must be fixed before merge

### 2) CLI Drift Beacon (observation)

- Workflow: `.github/workflows/cli-observation.yml`
- Command: `npm run validate:fixtures:claude`
- Triggers:
  - `pull_request` (paths relevant to fixtures/schemas/evidence)
  - `schedule` (daily)
  - `workflow_dispatch`
- Behavior:
  - PR runs are review-gating signals for changed expectations.
  - Scheduled runs are non-blocking and open/update a drift issue on failure.

### 3) Deviations Metadata Sync Check

- Workflow: `.github/workflows/deviations-metadata-check.yml`
- Command: `npm run sync:deviations-metadata -- --check`
- Scope:
  - verifies README Known Deviations metadata markers align with canonical sources
  - does not generate or alter ordinary-language deviation bullets

## Known Deviations Metadata Sources

The metadata line in README is synced from:

- `DATE`: `docs/FIXTURE-EVIDENCE.json` -> `sourceRefs.cliRun.checkedAt`
- `CLI VERSION`: `docs/FIXTURE-EVIDENCE.json` -> `sourceRefs.cliRun.cliVersion`
- `SCHEMA VERSION`: `package.json` -> `version`
- `REPO SHA`: `git rev-parse --short HEAD` (informational)

Sync command:

```bash
npm run sync:deviations-metadata
```

## Interpretation

- Contract CI failure means repository breakage.
- CLI observation failure means behavior/expectation drift and evidence should be reviewed.
- Metadata check failure means contextual metadata in README is stale or malformed.

## Judgment vs Automation Boundary

- Human-judgment zone:
  - defining conditions
  - defining assertion mappings and expected outcomes
  - resolving ambiguous or conflicting upstream evidence
- Automation zone:
  - schema fixture validation
  - CLI observation execution
  - README metadata synchronization checks

For roadmap work (including assertion-matrix expansion), see `planning/WORKING-PLAN.md`.
