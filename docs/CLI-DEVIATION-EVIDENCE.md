# Claude CLI Deviation Evidence

This document is the concrete evidence source for the claims in `docs/NOTES.md`.

## Run metadata

- Checked at: 2026-02-18 (local machine)
- CLI version: `2.1.44 (Claude Code)`
- Command: `node tools/validate-fixtures-claude.mjs`
- Fixture set: `fixtures/synthetic/{pass,fail}/{plugin,marketplace}/*.json`

## Observed mismatches

The run reported 4 mismatches across 15 fixtures:

1. `fixtures/synthetic/pass/plugin/official-ish.json`
- Expected: pass
- Actual: fail (exit 1)
- Reported by CLI:
  - `repository: Invalid input: expected string, received object`
  - `agents: Invalid input`

2. `fixtures/synthetic/fail/plugin/name-must-be-kebab-case.json`
- Expected: fail
- Actual: pass (exit 0)
- Interpretation: CLI accepts plugin names outside documented kebab-case form (for example camelCase).

3. `fixtures/synthetic/fail/plugin/version-must-be-semver.json`
- Expected: fail
- Actual: pass (exit 0)
- Interpretation: CLI accepts non-semver plugin versions (for example `1.0`).

4. `fixtures/synthetic/fail/marketplace/no-additional-top-level-properties.json`
- Expected: fail
- Actual: pass (exit 0)
- Interpretation: CLI accepts unknown top-level marketplace properties.

## Notes

- This is an implementation-observation log, not an upstream normative source.
- Confirmed non-deviation: `fixtures/synthetic/fail/plugin/no-additional-top-level-properties.json` fails in the CLI (unknown key is rejected).
- To refresh this evidence, rerun:
  - `claude --version`
  - `node tools/validate-fixtures-claude.mjs`
