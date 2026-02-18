---
name: ajv-strict-schema-doctor
description: Diagnoses and repairs AJV strict-mode JSON Schema compilation failures (especially draft 2020-12) by running a bundled doctor script, classifying errors, and applying schema-local patches. This skill should be used when `ajv.compile`, `npm run compile`, `npm test`, or CI reports strict-mode errors such as `strictTypes`, `strictRequired`, `allowMatchingProperties`, properties/patternProperties overlap, unresolved `$ref`, unknown formats/keywords, duplicate `$id`, or invalid schema JSON. Also use when users say "schema won't compile", "strict mode error", "AJV error", or "fix my JSON Schema".
---

# AJV Strict Schema Doctor

Diagnose and fix AJV strict-mode compilation errors by classifying failures and applying schema-local patches -- keeping strict mode enabled.

## Quick Start

Reproduce the failure, then run the doctor:

```bash
# 1. Confirm the failure
npm run compile        # or: npm test

# 2. Run the doctor (from project root)
node .agents/skills/ajv-strict-schema-doctor/scripts/ajv_strict_doctor.mjs \
  --schemas "schemas/**/*.json"

# 3. Read output, apply patches, repeat until zero failures
# 4. Verify with the project's own compile/test
npm test
```

Example output:

```
AJV strict schema doctor
cwd: /path/to/project
strict: true
matched files: 2

✅ Compiled: schemas/plugin.schema.json
❌ Failed: schemas/marketplace.schema.json
   Class: strictTypes
   Cause: Type-specific keywords are used without an explicit type.
   Fix:   Add explicit `type` (usually `object` or `array`) where `properties`, `required`, `items`, etc. are used.
   Error: strict mode: "properties" is required...

Summary: 1 passed, 1 failed.
```

## Workflow

1. **Reproduce** with the repository's compile command (`npm run compile` or `npm test`).
2. **Run the doctor** with the appropriate `--schemas` glob for your project.
3. **Classify** each failure using the `Class` field in the output.
4. **Apply schema-local patches** -- consult `references/AJV_QUIRKS.md` for the error class.
5. **Re-run** the doctor until failures are zero.
6. **Verify** with the full project test suite.

## Defaults

- Prefer schema-local fixes over global AJV relaxations.
- Keep strict mode enabled unless the user explicitly chooses otherwise.
- If a strict option must be relaxed, scope it narrowly and document why.

## Script Options

| Flag | Description | Default |
|------|-------------|---------|
| `--schemas "<glob>[,...]"` | Include patterns | `schemas/**/*.json` |
| `--ignore "<glob>[,...]"` | Ignore patterns | `.git`, `node_modules`, `dist`, `build` |
| `--strict <true\|log\|false>` | Strict setting passed to AJV | `true` |
| `--json` | Print JSON report to stdout | off |
| `--report <path>` | Write JSON report to file | none |
| `--cwd <path>` | Working directory root for glob resolution | `process.cwd()` |

## Triage by Error Class

| Class | Quick Fix |
|-------|-----------|
| `strictTypes` | Add explicit `type` where `properties`/`required`/`items` appear |
| `strictRequired` | Define required keys in the same subschema branch |
| `allowMatchingProperties` | Narrow `patternProperties` regex to exclude literal `properties` keys |
| `unknown-keyword` | Fix spelling, check draft version, or register custom keyword |
| `unknown-format` | Use standard format, register custom, or remove |
| `unresolved-ref` | Fix `$id`/`$ref` paths; ensure referenced schemas are loaded |
| `duplicate-schema-id` | Make each `$id` unique |
| `invalid-schema` | Fix keyword/value structure per meta-schema |
| `invalid-json` | Fix JSON syntax |

For detailed patch patterns, decision rules, and worked examples, load `references/AJV_QUIRKS.md`.

## Troubleshooting

**Doctor finds zero files:**
Check your `--schemas` glob. The default is `schemas/**/*.json`. Use `--cwd` if running from a different directory.

**Doctor passes but `npm run compile` still fails:**
The project compile script may use different AJV options or load schemas in a different order. Compare `strict` settings and schema loading in `tools/compile-schemas.mjs` (or equivalent) with the doctor's defaults.

**`missing-2020-metaschema` error:**
The project's AJV instance uses the wrong import. Change `import Ajv from "ajv"` to `import Ajv from "ajv/dist/2020.js"`.

**Need more diagnostic detail:**
Use `--strict log` to convert errors to warnings and see all issues at once, then switch back to `--strict true` for enforcement.
