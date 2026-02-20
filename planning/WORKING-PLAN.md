# Working Plan

## Status Model

Primary ordered states:

1. `proposed`: idea captured, not yet approved.
2. `accepted`: approved to build, not yet started.
3. `in-development`: active design/implementation.
4. `implemented`: live in repository.

Secondary state (not ordered):

- `under-revision`: requirements or design are being revised before further progress.

State policy:

- Work does not move to `in-development` unless it is already `accepted`.
- `under-revision` may be applied alongside `proposed`, `accepted`, or `in-development`.

## Item: `sync-deviations-metadata`

Status: `accepted`

Goal:

- Keep Known Deviations in ordinary English.
- Add metadata only: `DATE`, `CLI VERSION`, `SCHEMA VERSION`, `REPO SHA`.

### Blocking prerequisite: "badge/check system in place"

Required tasks:

- [ ] Keep `validate:fixtures` as contract CI (blocking).
- [ ] Add a separate CLI observation workflow (`validate:fixtures:claude`).
- [ ] Configure scheduled execution for drift detection.
- [ ] Implement issue upsert/update behavior on failure.
- [ ] Keep scheduled CLI observation runs non-blocking.
- [ ] Add workflow badges to README only after workflows exist and are stable.

Clarification:

- Exhaustive assertion matrix or generator is not required to ship metadata sync.
- Exhaustive coverage is required for strong certainty claims from drift signals.

### Implementation task list (after prerequisite)

- [ ] Define `DATE` source as `docs/FIXTURE-EVIDENCE.json` (`sourceRefs.cliRun.checkedAt`).
- [ ] Define `CLI VERSION` source as `docs/FIXTURE-EVIDENCE.json` (`sourceRefs.cliRun.cliVersion`).
- [ ] Define `SCHEMA VERSION` source as `package.json` version (unless replaced by explicit schema version field).
- [ ] Define `REPO SHA` source as current commit (`git rev-parse --short HEAD`).
- [ ] Add metadata markers in README under Known Deviations.
- [ ] Add `tools/sync-deviations-metadata.mjs` to update metadata markers only.
- [ ] Add npm script for metadata sync.
- [ ] Add CI check that fails if metadata markers are stale in PRs touching evidence/schema/README.

Acceptance criteria:

- README deviation prose remains fully manual/ordinary language.
- Metadata line is machine-synced and reproducible.
- No content transpilation is performed by metadata sync.

## Item: `sync-deviations`

Status: `proposed`

Goal:

- Auto-sync ordinary-language Known Deviations content from evidence + mappings, while preserving readability.

### To move from `proposed` to `accepted`

- [ ] Define a fixture/assertion-to-English mapping document format.
- [ ] Define condition-level aggregation rules from assertion outcomes.
- [ ] Define how to express incomplete coverage (`uncertain`/`inconclusive`) in generated prose.
- [ ] Define review/approval policy for generated English text changes.

### Candidate implementation tasks (post-acceptance)

- [ ] Create mapping artifact (assertion IDs and fixture names -> English sentences).
- [ ] Introduce golden fixtures and minimal-delta assertion fixtures per condition.
- [ ] Add matrix/generator support to ensure each assertion has a targeted fixture probe.
- [ ] Implement deterministic generation of README Known Deviations prose from mappings + evidence.
- [ ] Add CI guard for generated deviation content drift.

Acceptance criteria:

- Every generated deviation sentence is traceable to condition/assertion evidence.
- Generated prose remains user-facing and plain-language.
- Uncertainty is explicit when coverage is not exhaustive.
