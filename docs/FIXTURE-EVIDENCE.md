# Fixture Evidence (Human View)

This is the human-readable view of `docs/FIXTURE-EVIDENCE.json`.

## Terminology

- `condition`: what the schema requires/permits/denies.
- `fixture`: a concrete synthetic manifest used in tests.
- `assertion`: a fixture evaluated against a condition.

## CLI Enforcement Scale

- `0`: CLI enforces the condition (good passes, bad fails).
- `1`: mixed/partial behavior.
- `2`: CLI enforces the dual (good fails, bad passes).

## Condition Matrix

| Condition ID | Kind | Coverage | Good Fixture | Bad Fixture | CLI Code | Notes |
|---|---|---|---|---|---:|---|
| `plugin-name-kebab-case` | plugin | paired | `fixtures/synthetic/pass/plugin/minimal.json` | `fixtures/synthetic/fail/plugin/name-must-be-kebab-case.json` | 1 | CLI accepts camelCase plugin names. |
| `plugin-version-semver` | plugin | paired | `fixtures/synthetic/pass/plugin/version-allows-prerelease-semver.json` | `fixtures/synthetic/fail/plugin/version-must-be-semver.json` | 1 | CLI accepts non-semver values like `1.0`. |
| `plugin-top-level-additional-properties-rejected` | plugin | paired | `fixtures/synthetic/pass/plugin/minimal.json` | `fixtures/synthetic/fail/plugin/no-additional-top-level-properties.json` | 0 | CLI aligns with schema on unknown plugin keys. |
| `plugin-component-path-dot-slash` | plugin | single-sided | _(none)_ | `fixtures/synthetic/fail/plugin/path-must-start-dot-slash.json` | 0 | Only bad-side probe currently exists. |
| `plugin-complex-manifest-forms` | plugin | single-sided | `fixtures/synthetic/pass/plugin/official-ish.json` | _(none)_ | 1 | CLI rejects this schema-accepted complex fixture. |
| `marketplace-owner-required` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/missing-owner.json` | 0 | CLI aligns with schema. |
| `marketplace-owner-name-required` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/owner-missing-name.json` | 0 | CLI aligns with schema. |
| `marketplace-plugins-array` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/plugins-must-be-array.json` | 0 | CLI aligns with schema. |
| `marketplace-name-kebab-case` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/name-must-be-kebab-case.json` | 0 | CLI aligns with schema. |
| `marketplace-plugin-name-kebab-case` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/plugin-name-must-be-kebab-case.json` | 0 | CLI aligns with schema. |
| `marketplace-relative-source-dot-slash` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/plugin-source-must-start-dot-slash.json` | 0 | CLI aligns with schema. |
| `marketplace-github-sha-40hex` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/github-sha-must-be-40-hex.json` | 0 | CLI aligns with schema. |
| `marketplace-top-level-additional-properties-rejected` | marketplace | paired | `fixtures/synthetic/pass/marketplace/basic.json` | `fixtures/synthetic/fail/marketplace/no-additional-top-level-properties.json` | 1 | CLI accepts unknown marketplace top-level keys. |

## Sources

Primary evidence sources are recorded in `docs/FIXTURE-EVIDENCE.json` under `sourceRefs`.
