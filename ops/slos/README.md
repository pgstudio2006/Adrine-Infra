# Service level objectives (draft)

Targets apply once production traffic exists. Instrumentation uses OpenTelemetry via `@adrine/otel-bootstrap` and export to Grafana Cloud or a self-hosted stack (Prometheus + Tempo + Loki).

## Kernel API (`kernel-api`)

| Metric | Target |
|--------|--------|
| Availability | 99.9% monthly |
| p95 latency (authenticated API, excluding AI) | < 200 ms |
| Error rate (5xx) | < 0.1% |

## Domain API (`domain-api`)

| Metric | Target |
|--------|--------|
| Availability | 99.9% monthly |
| p95 latency (CRUD) | < 200 ms |

## AI Gateway

| Metric | Target |
|--------|--------|
| Availability | 99.5% monthly (external model dependency) |
| p95 latency (streaming TTFB) | product-defined per model |

## Workflow runtime

| Metric | Target |
|--------|--------|
| Workflow success rate | > 99.5% |
| Task backlog age p95 | < 5 min for interactive workflows |

## Dashboards

Wire Grafana dashboards from exported JSON in `ops/slos/dashboards/` (to be added). Synthetic checks: Checkly or Grafana k6 against `/healthz` and one authenticated smoke path per environment.
