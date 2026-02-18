# Usage

This document explains how to use the published schemas for IDE assistance and command-line validation.

## 1) Local IDE Integration (Fastest Path)

### VS Code (`.vscode/settings.json`)

Local path variant (when schema files are in your current repo):

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/.claude-plugin/plugin.json"],
      "url": "./schemas/plugin.schema.json"
    },
    {
      "fileMatch": ["**/.claude-plugin/marketplace.json"],
      "url": "./schemas/marketplace.schema.json"
    }
  ]
}
```

Remote URL variant (centralized hosting):

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/.claude-plugin/plugin.json"],
      "url": "https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/plugin.schema.json"
    },
    {
      "fileMatch": ["**/.claude-plugin/marketplace.json"],
      "url": "https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/marketplace.schema.json"
    }
  ]
}
```

For stability in shared environments, prefer tag-pinned URLs (`.../vX.Y.Z/...`) instead of `main`.

### JetBrains IDEs (IntelliJ/WebStorm/etc.)

1. Open Settings/Preferences.
2. Go to `Languages & Frameworks` -> `Schemas and DTDs` -> `JSON Schema Mappings`.
3. Add mappings:
   - Schema file: `schemas/plugin.schema.json` -> Pattern: `.claude-plugin/plugin.json`
   - Schema file: `schemas/marketplace.schema.json` -> Pattern: `.claude-plugin/marketplace.json`

## 2) Published URL References

Main branch URLs:

- `https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/plugin.schema.json`
- `https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/marketplace.schema.json`

Tag-pinned URLs for reproducible builds:

- `https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/vX.Y.Z/schemas/plugin.schema.json`
- `https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/vX.Y.Z/schemas/marketplace.schema.json`

## 3) Using `$schema` In Manifest Files

```json
{
  "$schema": "https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/plugin.schema.json",
  "name": "my-plugin",
  "version": "1.0.0"
}
```

## 4) Standalone Validation With npx

Validate a directory recursively:

```bash
npx github:hesreallyhim/claude-code-json-schema cc-schema-lint /path/to/project
```

Validate a specific plugin manifest:

```bash
npx github:hesreallyhim/claude-code-json-schema cc-schema-lint --plugin /path/to/.claude-plugin/plugin.json
```

Validate a specific marketplace manifest:

```bash
npx github:hesreallyhim/claude-code-json-schema cc-schema-lint --marketplace /path/to/.claude-plugin/marketplace.json
```

Tag-pinned invocation:

```bash
npx github:hesreallyhim/claude-code-json-schema#vX.Y.Z cc-schema-lint /path/to/project
```

## 5) Repo-Local Manifest Lint Command

From this repository:

```bash
node tools/lint-manifests.mjs [--plugin] [--marketplace] [path]
```

If `[path]` is omitted, the command recursively scans the current working directory (`.`).

Examples:

```bash
node tools/lint-manifests.mjs
node tools/lint-manifests.mjs .
node tools/lint-manifests.mjs --plugin
node tools/lint-manifests.mjs --marketplace /path/to/project
```

## 6) Runtime vs Schema Reality

Do not assume schema acceptance and Claude CLI acceptance are always identical. Drift can occur; track active mismatches in `docs/NOTES.md`.
