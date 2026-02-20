# Sync Deviations Uncertainty Guidelines

This proposal defines how generated Known Deviations prose should express incomplete coverage.

## Terminology

- Preferred status term: `inconclusive`
- Allowed explanatory synonym in narrative text: `uncertain`

Rationale:

- `inconclusive` is precise for standards-style evidence reporting.
- `uncertain` is optional helper language for general readers.

## Trigger Conditions

Use incompleteness language when any of the following is true:

- condition has only `single-sided` assertion coverage
- condition has missing good or bad probes for required claim direction
- evidence source is stale or unavailable for current run context

## Prose Rules

Per-condition caveat is required when a condition is inconclusive.

Recommended sentence shape:

- "`<Condition English statement>` is currently inconclusive because `<coverage limitation>`."

Optional global summary line:

- "Some conditions are inconclusive due to incomplete assertion coverage."

## Do/Don't

Do:

- state incompleteness explicitly
- identify the specific missing probe/coverage limitation
- keep language factual, not speculative

Don't:

- present inconclusive conditions as enforced
- imply regression/improvement when evidence is incomplete
- hide caveats in footnotes only

## Example

- "Plugin complex manifest support is currently inconclusive because only good-side probes exist."
