-- Wave 0: password login for provisioned platform users
ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
