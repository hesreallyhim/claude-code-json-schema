# Checks and Signals

This document defines which checks are contract CI versus drift/observation signals, and how badges should be interpreted.

## Core Boundary

- Human-decided: condition definitions, schema shape, fixture/assertion mapping.
- Machine-decided: assertion outcomes against schema and observed CLI behavior.

## Contract CI (Internal Health)

- Workflow: `ci.yml`
- Primary command: `npm run validate:fixtures`
- Scope: validates synthetic fixtures against this repo's schemas.
- Gate: blocking for pull requests and pushes.
- Badge meaning:
  - green: repository contract is internally coherent.
  - red: schema/fixture expectations are inconsistent and must be fixed before merge.

## CLI Observation (Drift Beacon)

- Recommended workflow: `cli-observation.yml`
- Primary command: `npm run validate:fixtures:claude`
- Scope: compares fixture expectations to current `claude plugin validate` behavior.
- Gate policy:
  - PRs that change schemas/fixtures/evidence: can be used as a review gate.
  - Scheduled runs without repo changes: non-blocking beacon that opens/updates a drift issue.
- Badge meaning:
  - green: current CLI behavior matches recorded expectations for covered assertions.
  - red: behavior changed or expectations changed; evidence/status needs refresh.

## Uncertainty Rule

CLI observation failures are deterministic only when condition coverage is exhaustive.

- Exhaustive condition coverage:
  - each condition has sufficient assertions (normally paired good/bad probes) to determine status.
  - observation failure can directly update condition status (`improved`, `regressed`, or `unchanged` after comparison).
- Non-exhaustive condition coverage:
  - some conditions are single-sided or under-specified.
  - observation failures may imply uncovered behavior, so status should be marked `uncertain`/`inconclusive` until coverage or judgment is updated.

Coverage source of truth is `docs/FIXTURE-EVIDENCE.json` (`assertionCoverage` per condition).

## Badge Set

Recommended public badges:

- `Contract CI`: status of `ci.yml` (internal health).
- `CLI Drift Beacon`: status of `cli-observation.yml` (external behavior drift).
- `Stability Indicator` (optional): derived summary badge driven by coverage + latest observation + docs-vs-schema review status.

## Practical Interpretation

- `Contract CI` red means "our repo is broken."
- `CLI Drift Beacon` red means "upstream or expectation drift detected."
- `Stability Indicator` uncertain means "open judgment required" (usually docs-vs-schema conflict or non-exhaustive coverage).
