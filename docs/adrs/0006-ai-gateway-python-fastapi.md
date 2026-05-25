# ADR 0006: AI Gateway in Python (FastAPI)

## Status

Accepted

## Context

Model providers, guardrails, token accounting, and rapid experimentation align with the Python AI ecosystem. Domain and kernel services must not hold raw provider keys.

## Decision

Implement **`services/ai-gateway`** with **FastAPI**, exposing OpenAPI, **model router stub**, **budget stub**, and **audit hooks** (structured logging in Phase 0). All model traffic from product surfaces routes through this gateway; TS services call it over HTTP with service identity (mTLS deferred to mesh phase).

## Consequences

- Positive: Fast iteration on policies and adapters; clear choke point for cost and safety.
- Negative: Additional network hop; requires shared tracing (OpenTelemetry) and strict timeouts.
