# ADR 0002: Polyglot services (TypeScript, Go, Python; Rust deferred)

## Status

Accepted

## Context

The platform spans interactive APIs, high-throughput events, AI workloads, and future streaming-heavy workloads. A single language would optimize hiring but under-serves latency-sensitive and Python-native AI ecosystems.

## Decision

- **TypeScript:** NestJS for `kernel-api` and `domain-api`; Next.js for experiences and control plane; shared packages via pnpm workspaces.
- **Go:** Event routing, notification fan-out, integration workers (`services/event-router` and future workers). Start with a minimal Go stub that compiles and documents extension points.
- **Python (FastAPI):** `services/ai-gateway` (model router, policy, budget, audit) and future agent/MCP services.
- **Rust:** **Deferred to Phase 3+** for DICOM/PACS streaming and high-throughput FHIR transforms unless a measured hot path forces earlier adoption. A placeholder folder documents intent only.

## Consequences

- Positive: Right tool per plane; AI ecosystem stays in Python; Go suits NATS/Kafka edge workers.
- Negative: Multiple CI jobs, container bases, and operational playbooks; strict API contracts (OpenAPI) are mandatory.
