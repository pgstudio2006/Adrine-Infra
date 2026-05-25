# ADR 0007: Compute progression — ECS Fargate first, EKS when justified

## Status

Accepted

## Context

Early teams need fast, safe deploys with minimal Kubernetes operational burden. Service count and team size will eventually favor a control plane-rich runtime.

## Decision

- **Phase 0–2:** Run stateless APIs, workers, and gateways on **Amazon ECS Fargate** with Terraform-defined clusters and services.
- **Phase 3+:** Migrate to **Amazon EKS** when service mesh, multi-tenant worker pools, or operator patterns require Kubernetes. Migration must be **contract-preserving** (same load balancers, health checks, and OpenAPI surfaces).

## Consequences

- Positive: Lower Day-0 ops burden; Terraform modules already structured for later EKS addition under `infra/terraform/modules`.
- Negative: Potential migration work; service identity today uses IAM roles for tasks rather than mesh mTLS.
