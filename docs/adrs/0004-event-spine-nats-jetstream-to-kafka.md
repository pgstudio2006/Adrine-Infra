# ADR 0004: Event spine — NATS JetStream first, path to Kafka (MSK)

## Status

Accepted

## Context

We need a durable, replayable event backbone without operating Kafka prematurely. Fan-out, retention, and operator maturity differ by growth stage.

## Decision

- **Phase 0–2:** **NATS JetStream** as the primary event spine (durable streams, simple ops on Fargate). Domain and kernel APIs publish via an **outbox** in PostgreSQL (transactional) drained to JetStream—see implementation notes in `domain-api` / `kernel-api` READMEs (structured logs and in-memory bus stub in code until connectors land).
- **Phase 3+:** Introduce **Amazon MSK (Kafka)** when fan-out, retention SLAs, or ecosystem integrations justify the operational cost. Event contracts remain namespace-stable (`adrine.<domain>.<entity>.<verb>`).

## Consequences

- Positive: Lower initial cost and complexity; clear migration axis (contract-first events).
- Negative: Two spine technologies over lifetime; requires disciplined schema versioning and consumer idempotency from day one.
