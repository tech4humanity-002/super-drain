# Super Drain → T4H World Runtime

Super Drain is an intake source, not an execution authority.

## Event mapping

A completed intake batch emits a World Runtime event with:

- `source: super-drain`
- `signal_type: intake.completed`
- `subject: batch_id`
- `provenance` containing source and evidence hash
- `context` containing occurrence counts, unfinished work and opportunity counts
- `authority` copied only when an actual authority envelope exists

The adapter must never infer authorisation from ingestion alone.

## Operational boundary

`Super Drain -> World Runtime -> capability/agent -> Runtime -> receipt -> verification -> outcome -> Utopia`

The browser-local Super Drain application can continue to operate when the World Runtime is unavailable. It must mark delivery `PARTIAL` or `DEGRADED`, not fabricate a receipt.

## Browser independence

The source event can be emitted by a scheduled/server worker. Browser presence is optional.
