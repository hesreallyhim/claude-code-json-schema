# Changelog

**NOTE:** This is the CHANGELOG for the current repo itself. It tracks changes to the repository and the policies active at that time. The schemas have their own versions, as does the plugin marketplace.

## v1.0.0 - 2026-02-18

- Stabilized public schema contract for `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- Added `cc-schema-lint` CLI for local/CI validation and recursive manifest discovery.
- Expanded synthetic fixture coverage and added fixture-level provenance (`docs/FIXTURE-EVIDENCE.json`).
- Added Claude CLI compatibility suite (`validate:fixtures:claude`) with runner fallback (`claude` -> `npx @anthropic-ai/claude-code`).
- Introduced upstream docs snapshot attribution (`THIRD_PARTY_NOTICES.md`) and evidence logging for known CLI/schema deviations.
- Completed public-repo cleanse prep (non-essential reference/diagnostic content removed from public branch scope).

## 0.1.0

- Initial release: plugin + marketplace schemas
- CI: Ajv strict compilation + fixtures validation
- Scheduled upstream snapshot monitor (`llms.txt`)
