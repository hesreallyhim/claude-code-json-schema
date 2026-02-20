# Sync Deviations Fixture Matrix Design

This proposal starts implementation of checklist item 86: explicit golden fixtures plus minimal-delta probes per condition.

## Baseline Fixtures

Golden fixtures are now introduced under:

- `fixtures/synthetic/golden/plugin/golden-plugin.json`
- `fixtures/synthetic/golden/marketplace/golden-marketplace.json`

These are canonical pass baselines for mutation-based assertion probes.

## Minimal-Delta Principle

For each condition assertion:

- start from the relevant golden fixture
- mutate only one semantic aspect tied to the target condition
- keep all unrelated fields identical

This reduces confounding factors and improves attribution of failures.

## Probe Structure

Recommended mapping:

- good probe: mutated or baseline fixture expected to pass for the condition
- bad probe: minimal mutation expected to fail for the condition

When only one side exists, condition status should remain inconclusive until complementary probes are added.

## Migration Strategy

Staged rollout:

1. Introduce explicit golden fixtures (completed).
2. Annotate current assertions with mutation targets.
3. Gradually migrate existing pass/fail fixtures to golden-derived probes.
4. Add matrix/generator support to enforce one-target mutation discipline.

## Notes

- Existing validation scripts still operate on `fixtures/synthetic/pass` and `fixtures/synthetic/fail`.
- Golden fixtures are introduced first as design anchors; enforcement migration is subsequent work.
