-- Link CRM leads to OPD visits for reception → CRM handoff
ALTER TABLE "crm_leads" ADD COLUMN IF NOT EXISTS "opd_visit_id" TEXT;

CREATE INDEX IF NOT EXISTS "crm_leads_tenant_id_opd_visit_id_idx" ON "crm_leads"("tenant_id", "opd_visit_id");
