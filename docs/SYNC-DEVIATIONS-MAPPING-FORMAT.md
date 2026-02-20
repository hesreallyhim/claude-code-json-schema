# Sync Deviations Mapping Format

This proposal defines a canonical mapping format from fixture/assertion identifiers to plain-English deviation text units.

## Purpose

- Preserve human-readable Known Deviations prose.
- Keep generated text traceable to evidence artifacts.
- Enable deterministic downstream aggregation/generation.

## Canonical Format

The canonical source should be machine-readable JSON with one row per assertion mapping unit.

Minimum fields:

- `mappingId`: stable unique id for the mapping row.
- `conditionId`: condition identifier from `docs/FIXTURE-EVIDENCE.json`.
- `assertionId`: stable assertion identifier (must be unique within condition).
- `fixturePath`: fixture path this assertion probes.
- `role`: `good` or `bad`.
- `expected`: expected evaluation outcome (`pass` or `fail`).
- `englishClause`: a short plain-English sentence fragment used in generated prose.
- `severity`: optional ordering signal (`info`, `warning`, `critical`).
- `tags`: optional list for grouping (example: `semver`, `kebab-case`).

## Integrity Constraints

- `conditionId` must exist in `docs/FIXTURE-EVIDENCE.json`.
- `fixturePath` must exist in `fixtures/synthetic/`.
- `role` + `expected` must align with the underlying assertion expectation.
- `englishClause` should be declarative and context-independent.
- No two rows may share the same `mappingId`.

## Example Row

```json
{
  "mappingId": "plugin-version-semver.bad.nonsemver",
  "conditionId": "plugin-version-semver",
  "assertionId": "bad.nonsemver",
  "fixturePath": "fixtures/synthetic/fail/plugin/version-must-be-semver.json",
  "role": "bad",
  "expected": "fail",
  "englishClause": "CLI accepts non-semver plugin versions as pass.",
  "severity": "warning",
  "tags": ["plugin", "version", "semver"]
}
```

## Output Relationship

- This format is canonical for generation logic.
- Markdown tables or narrative summaries are derived views, not source of truth.
