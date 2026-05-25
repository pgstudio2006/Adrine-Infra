terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "name_prefix" {
  type    = string
  default = "adrine-dev"
}

module "vpc" {
  source      = "../../modules/vpc"
  name_prefix = var.name_prefix
}

module "rds_stub" {
  source      = "../../modules/rds"
  name_prefix = var.name_prefix
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
