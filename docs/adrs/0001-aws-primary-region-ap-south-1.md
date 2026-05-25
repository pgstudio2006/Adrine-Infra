# ADR 0001: AWS primary region ap-south-1 (Mumbai)

## Status

Accepted

## Context

Adrine is India-first (DPDP, ABDM/ABHA, GST) with a roadmap to global regions. We need a default cloud region that minimizes latency for Indian hospitals and aligns with data residency expectations while keeping the architecture region-pluggable.

## Decision

Use **AWS `ap-south-1` (Mumbai)** as the primary production region for Phase 0–2. All Terraform environment defaults target this region; additional `prod-<region>` stacks are added without changing service contracts.

## Consequences

- Positive: Lower latency, clearer India compliance story, single-region operational simplicity early.
- Negative: Global customers require explicit multi-region work (Phase 5); DR drills must account for regional concentration.
- Implementation: Environment naming includes `prod-ap-south-1`; IAM, KMS, and RDS are region-scoped per stack.
