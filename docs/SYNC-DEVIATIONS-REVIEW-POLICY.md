# Sync Deviations Review Policy

This proposal defines review and approval rules for generated Known Deviations English text.

## Scope

Applies to:

- generated prose blocks derived from mapping/evidence artifacts
- policy changes affecting generated prose semantics

Does not apply to:

- manually maintained non-generated narrative outside designated generated blocks

## Approval Rules

- Generated prose changes require explicit human review before merge.
- Auto-merge of generated prose is not allowed during early rollout.
- At least one maintainer approval is required for:
  - wording changes that alter claim strength
  - status-term changes (`enforced`/`divergent`/`inconclusive`)
  - uncertainty caveat behavior

## Allowed Manual Overrides

Manual edits to generated prose are allowed only when:

- accompanied by a rationale note in PR description or commit message
- linked to the relevant condition/assertion identifiers
- followed by a task to reconcile generator/mapping behavior

## Review Checklist

- Is each sentence traceable to condition/assertion evidence?
- Does wording preserve the intended confidence level?
- Are incompleteness caveats present where required?
- Are changes consistent with `docs/SYNC-DEVIATIONS-AGGREGATION-RULES.md` and
  `docs/SYNC-DEVIATIONS-UNCERTAINTY-GUIDELINES.md`?

## Exceptions

Emergency/manual exceptions are allowed to correct materially misleading public text, but must be documented with:

- reason for override
- intended follow-up automation fix
- owner and target milestone
