# ADR 0005: Temporal for durable healthcare workflows

## Status

Accepted

## Context

Healthcare journeys (OPD, discharge, reminders) are long-running, failure-prone, and require signals, timers, and human steps. Ad-hoc cron and queue chains become unsafe quickly.

## Decision

Use **Temporal** as the workflow engine. Ship a **TypeScript worker** (`services/workflow-runtime`) co-located in the monorepo with versioned workflow definitions and time-skippable tests in later phases. Temporal Server runs on **ECS Fargate** initially; **EKS** remains the Phase 3+ home when cluster operational load warrants it (see ADR 0007).

## Consequences

- Positive: Durable execution, replay, polyglot SDKs, clear failure semantics.
- Negative: Operational learning curve; must enforce workflow determinism and versioning discipline.
