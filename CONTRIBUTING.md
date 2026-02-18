# Contributing

Thanks for your interest.

## Scope

This project is a practical, best-effort schema reconstruction for Claude Code manifests. It is intentionally conservative and low-overhead.

## Usually accepted

- Technical bug fixes in schemas, scripts, and CI.
- Reproducibility and validation reliability improvements.
- Synthetic fixture additions with clear rationale.
- Documentation improvements tied to concrete behavior.

## Usually not accepted directly

- Speculative semantic expansions without strong evidence.
- Large refactors not tied to correctness or maintainability.
- Changes that materially increase maintenance burden without clear return.

## Evidence-first path for semantic claims

If your change is about manifest meaning (allowed/required fields, strictness, etc.):

1. Provide concrete evidence:
   - exact docs URL(s)
   - exact CLI behavior reproduction steps/output
2. Document conflicts explicitly (docs vs CLI behavior).
3. Let maintainers decide schema changes and fixture expectations.

## Maintainer boundary

Maintainers retain final judgment over:

- schema contract changes
- fixture gating decisions
- policy/scope decisions

## Practical tips

- Keep PRs small and focused.
- Include exact file paths and reasoning.
- Include date-checked doc references for behavior claims.
