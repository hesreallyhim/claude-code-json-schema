# Sync Deviations Aggregation Rules

This proposal defines deterministic condition-level status derivation from assertion outcomes.

## Inputs

- Expected outcomes per assertion (from mapping/evidence model).
- Observed outcomes per assertion (from validation runner).
- Assertion coverage metadata (paired or single-sided).

## Condition Status Set

- `enforced`: all covered assertions match expectations.
- `divergent`: at least one covered assertion conflicts with expectations.
- `inconclusive`: coverage is insufficient to claim enforced/divergent with confidence.

Optional delta labels (time-comparative):

- `improved`: status moved toward enforcement versus previous run.
- `regressed`: status moved away from enforcement versus previous run.
- `unchanged`: no directional change.

## Rule Precedence

Apply in this order:

1. If coverage is incomplete for the condition and no contradictory evidence exists, mark `inconclusive`.
2. If any covered assertion is mismatched, mark `divergent`.
3. If all covered assertions match and coverage is sufficient, mark `enforced`.

Precedence note:

- `divergent` outranks `enforced`.
- `inconclusive` is used when evidence cannot support a definitive claim.

## Coverage Sufficiency

Default sufficiency rule:

- `paired` coverage: sufficient for deterministic condition status.
- `single-sided` coverage: insufficient for definitive enforcement claims unless explicitly overridden by policy.

## Example

Condition: `plugin-version-semver`

- Expected:
  - good fixture passes
  - bad fixture fails
- Observed:
  - good passes
  - bad passes
- Result: `divergent` (mismatch present).
