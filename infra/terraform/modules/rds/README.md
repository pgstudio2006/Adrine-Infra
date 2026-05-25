# RDS module (stub)

This module is intentionally incomplete. Before creating `aws_db_instance`, add:

- Private subnets and `aws_db_subnet_group`
- `aws_security_group` allowing 5432 from ECS tasks only
- KMS CMK for storage encryption and optional column-level keys
- Secrets Manager for master password rotation
- Multi-AZ and read replicas per environment tier

The VPC module (`../vpc`) is the minimal building block that `terraform validate` can check in isolation.
