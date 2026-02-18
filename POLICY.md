# Policy

This repository publishes a best-effort reconstruction of JSON Schemas for Claude Code manifests (`plugin.json` and `marketplace.json`).

It is not an authoritative upstream specification and is not formally endorsed by Anthropic.

## Scope

- Maintain one public schema contract per manifest type.
- Keep validation and tooling simple and maintainable.
- Prioritize alignment with official Claude Code docs and observable CLI behavior.

## Evidence model

Schema decisions are based on:

- official Claude Code documentation
- direct interaction with Claude CLI validation behavior
- synthetic fixtures used as hard validation gates

When sources disagree, the conflict is recorded in `docs/NOTES.md`.

## Public/private boundary

Public repo contains:

- published schemas
- synthetic fixtures
- user-facing docs
- upstream docs snapshots

Private repo contains:

- harvested/community-source reference corpora
- extracted observed manifests
- frequency and deviation analysis
- per-source diagnostics

Only aggregate conclusions and resulting schema/doc updates are promoted to public.

## Maintenance posture

This project intentionally stays modest in scope so it can adapt quickly if Anthropic publishes official schemas.
