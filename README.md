# claude-code-json-schema

Unofficial but really actually quite good JSON Schemas for Claude Code manifest files like `plugin.json` and `marketplace.json`. Intended to support developer tooling, plugin authors, and IDE integrations.

This project is not an authoritative specification and is not endorsed by, or affiliated with, or funded by, or probably even noticed by Anthropic PBC. It's partly a result of a sleepless night failing miserably to publish a plugin. Nevertheless, I think Codex did a pretty good job with it, and a best effort is made to ensure it's up to date with current documentation and the Claude Code application itself.

In addition, if you can believe it, this repo _itself_ houses its own plugin marketplace, which is just so Nolan-esque.

## Schemas

| File | Description |
|------|-------------|
| [`schemas/plugin.schema.json`](./schemas/plugin.schema.json) | Plugin manifest schema (`.claude-plugin/plugin.json`) |
| [`schemas/marketplace.schema.json`](./schemas/marketplace.schema.json) | Marketplace manifest schema (`.claude-plugin/marketplace.json`) |

## Quick start

For linting:

```bash
# I recommend assigning an alias to this:
npx github:hesreallyhim/claude-code-json-schema cc-schema-lint /path/to/project
```

## IDE integration

See [`USAGE.md`](./USAGE.md) for VS Code and JetBrains setup.

## Fixtures

> [!NOTE]
> [We have decided on a cleaner way to organize this - coming soon.]

Synthetic fixtures in `fixtures/synthetic/` verify schema behavior:

- `pass/` fixtures must validate
- `fail/` fixtures must fail validation
- Fixture-level provenance map: `docs/FIXTURE-EVIDENCE.json`

## Known Deviations (Current)

Observed mismatches between this schema set and current `claude plugin validate` behavior include:

- CLI accepts non-semver versions such as `1.0`.
- CLI accepts plugin names outside documented kebab-case format (`name-must-be-kebab-case` fixture mismatch).
- CLI accepts additional top-level properties in `marketplace.json` that this schema rejects.
- CLI currently rejects some schema-accepted plugin forms (for example `repository` object + certain `agents` values in `official-ish.json`).

These are tracked as implementation observations, not as alternate public contracts.

## Upstream monitoring

The scheduled workflow refreshes upstream documentation snapshots and reports fetch failures via issues.

## Public/private model

See [`docs/SYNC-AND-PRIVACY.md`](./docs/SYNC-AND-PRIVACY.md).

## Notes

See [`docs/NOTES.md`](./docs/NOTES.md) and [`CHANGELOG.md`](./CHANGELOG.md).

## Third-party notices

See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for documentation attribution.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).
