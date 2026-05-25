# Terraform (AWS)

- `environments/dev` — sample stack wiring the VPC stub and RDS placeholder.
- `modules/vpc` — minimal VPC (`10.0.0.0/16`).
- `modules/rds` — stub; expand before provisioning databases.

Run from an environment directory:

```bash
cd infra/terraform/environments/dev
terraform init
terraform validate
```

Applying requires AWS credentials and owner review of networking, KMS, and data residency.
