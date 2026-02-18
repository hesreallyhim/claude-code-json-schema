# AJV Strict-Mode Quirks (Patch-Oriented Reference)

Load this file after running the doctor script and getting a `Class` in the output.

## Decision Rules

1. **Keep strict mode on** by default.
2. **Prefer schema-local edits** to global AJV relaxations.
3. **Use global options only** when schema-local changes would break intended reuse or compatibility.
4. **Relax only one strict option at a time** and document why.
5. **Revert relaxation** after schema patch if possible.

## Error Class Matrix

| Class | Symptom Pattern | Typical Root Cause | Preferred Patch | Last-Resort Option |
|-------|-----------------|--------------------|-----------------|--------------------|
| `allowMatchingProperties` | property key "matches pattern" | `properties` key overlaps with `patternProperties` regex | Narrow regex or exclude known literal keys | `allowMatchingProperties: true` |
| `strictRequired` | required property not defined | `required` declared in nested branch without local property definition | Define required key in same subschema branch | `strictRequired: "log"` or `false` |
| `strictTypes` | strictTypes complaint | Using `properties`, `required`, `items`, etc. without explicit `type` | Add local `type` (`object`, `array`, etc.) | `strictTypes: "log"` or `false` |
| `unknown-keyword` | unknown keyword | typo, wrong draft keyword, or missing custom keyword registration | Fix spelling/draft or intentionally register keyword | disable strict checks only if intentional |
| `unknown-format` | unknown format | format not known by default AJV setup | use known format or register custom format | `validateFormats: false` |
| `unresolved-ref` | cannot resolve `$ref` | missing `$id`, inconsistent refs, schema not loaded | stabilize `$id` values and ref paths; load all refs | avoid unless migration requires temporary relax |
| `duplicate-schema-id` | key/id already exists | two schemas share same `$id` | make `$id` values unique | none |
| `invalid-schema` | schema is invalid | keyword value shape violates meta-schema | correct invalid keyword/value structure | none |
| `invalid-json` | JSON parse failure | syntax error in schema file | fix JSON syntax | none |
| `missing-2020-metaschema` | no schema with key or ref "https://json-schema.org/draft/2020-12/schema" | AJV instance uses wrong import (not 2020-12 build) | `import Ajv from "ajv/dist/2020.js"` | none |

## Patch Patterns with Before/After Examples

### `strictTypes`

The most common error. AJV strict mode requires an explicit `type` wherever type-specific keywords appear.

**Before (fails):**
```json
{
  "properties": {
    "name": { "type": "string" }
  },
  "required": ["name"]
}
```

**After (passes):**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  },
  "required": ["name"]
}
```

**Also applies to arrays:**
```json
{
  "type": "array",
  "items": { "type": "string" }
}
```

**Watch for `oneOf`/`anyOf` branches** -- each branch that uses `properties` needs its own `type`:
```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": { "kind": { "const": "a" } },
      "required": ["kind"]
    },
    {
      "type": "object",
      "properties": { "kind": { "const": "b" } },
      "required": ["kind"]
    }
  ]
}
```

### `strictRequired`

Triggered when `required` lists a property not defined in the same subschema's `properties`.

**Before (fails):**
```json
{
  "if": { "properties": { "kind": { "const": "x" } } },
  "then": {
    "required": ["value"]
  }
}
```

**After (passes):**
```json
{
  "if": {
    "type": "object",
    "properties": { "kind": { "const": "x" } },
    "required": ["kind"]
  },
  "then": {
    "type": "object",
    "properties": { "value": { "type": "string" } },
    "required": ["value"]
  }
}
```

### `allowMatchingProperties`

Triggered when a literal key in `properties` also matches a `patternProperties` regex.

**Before (fails):**
```json
{
  "type": "object",
  "properties": {
    "description": { "type": "string" }
  },
  "patternProperties": {
    "^[A-Za-z][A-Za-z0-9]*$": { "type": "string" }
  }
}
```

**After (passes) -- use negative lookahead:**
```json
{
  "type": "object",
  "properties": {
    "description": { "type": "string" }
  },
  "patternProperties": {
    "^(?!description$)[A-Za-z][A-Za-z0-9]*$": { "type": "string" }
  }
}
```

**Multiple excluded keys:**
```json
"^(?!description$|name$|version$)[A-Za-z][A-Za-z0-9]*$"
```

### `unknown-keyword`

**Common causes:**
- Using draft-07 keywords in a 2020-12 schema (e.g., `definitions` instead of `$defs`)
- Typos (`propeties` instead of `properties`)
- Custom keywords not registered with AJV

**Fix:** Check the keyword against the correct draft specification. For draft 2020-12:
- `definitions` -> `$defs`
- `dependencies` -> `dependentRequired` / `dependentSchemas`
- `additionalItems` -> `items` (with `prefixItems`)

### `unknown-format`

**Formats registered by default with `ajv-formats`:**
`date`, `time`, `date-time`, `duration`, `email`, `idn-email`, `hostname`, `idn-hostname`, `ipv4`, `ipv6`, `uri`, `uri-reference`, `uri-template`, `iri`, `iri-reference`, `uuid`, `json-pointer`, `relative-json-pointer`, `regex`

**Fix:** Either use one of the above, register a custom format, or remove the format annotation.

### `unresolved-ref`

**Common causes:**
1. `$ref` path doesn't match the target schema's `$id`
2. Referenced schema wasn't loaded into AJV before compilation
3. Relative refs break when `$id` base URI changes

**Debugging steps:**
1. Check the `$id` of the target schema
2. Ensure the referencing `$ref` matches exactly
3. Verify the target schema is loaded via `ajv.addSchema()` before the referencing schema is compiled
4. Use the doctor's `--json` flag to see the exact error message

### `duplicate-schema-id`

**Fix:** Search all schema files for the duplicated `$id` value and make each unique. This often happens when copying a schema file and forgetting to change the `$id`.

### `invalid-schema`

**Common causes:**
- `required` is not an array: `"required": "name"` -> `"required": ["name"]`
- `type` is not a valid value: `"type": "str"` -> `"type": "string"`
- `enum` is empty: `"enum": []` -> must have at least one element
- `properties` value is not an object

### `invalid-json`

**Fix:** Use a JSON linter or your editor's built-in JSON validation. Common issues:
- Trailing commas
- Single quotes instead of double quotes
- Unquoted keys
- Comments (not valid JSON)

## AJV Strict Options Reference

These options control AJV's strict-mode behavior. Only relax them as a last resort.

| Option | Values | Effect |
|--------|--------|--------|
| `strict` | `true` / `"log"` / `false` | Master switch for all strict checks |
| `strictTypes` | `true` / `"log"` / `false` | Require explicit `type` with type-specific keywords |
| `strictRequired` | `true` / `"log"` / `false` | Require `required` keys in local `properties` |
| `allowMatchingProperties` | `true` / `false` | Allow `properties` keys to match `patternProperties` |
| `validateFormats` | `true` / `false` | Validate `format` keyword values |
| `allowUnionTypes` | `true` / `false` | Allow `type` arrays like `["string", "number"]` |

**Recommended approach for debugging:** Set `strict: "log"` temporarily to see all warnings, fix them one by one, then restore `strict: true`.

## Draft 2020-12 Migration Notes

When migrating schemas from draft-07 to 2020-12:

| draft-07 | 2020-12 |
|----------|---------|
| `"$schema": "http://json-schema.org/draft-07/schema#"` | `"$schema": "https://json-schema.org/draft/2020-12/schema"` |
| `definitions` | `$defs` |
| `dependencies` (schema) | `dependentSchemas` |
| `dependencies` (required) | `dependentRequired` |
| `additionalItems` | Remove; use `prefixItems` + `items` |
| `$ref` alongside siblings | Allowed in 2020-12 (was ignored in draft-07) |
| `import Ajv from "ajv"` | `import Ajv from "ajv/dist/2020.js"` |
