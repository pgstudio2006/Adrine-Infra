-- Program 3: nursing vitals + notes (run against tenant DB when deploying domain-api)

CREATE TABLE IF NOT EXISTS "nursing_vital_rounds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nurse" TEXT NOT NULL,
    "shift" TEXT NOT NULL DEFAULT 'Morning',
    "bp" TEXT NOT NULL,
    "pulse" INTEGER NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "spo2" INTEGER NOT NULL,
    "pain_score" INTEGER NOT NULL,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nursing_vital_rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "nursing_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nurse" TEXT NOT NULL,
    "note_type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nursing_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "nursing_vital_rounds_tenant_id_admission_id_recorded_at_idx"
    ON "nursing_vital_rounds"("tenant_id", "admission_id", "recorded_at");

CREATE INDEX IF NOT EXISTS "nursing_notes_tenant_id_admission_id_created_at_idx"
    ON "nursing_notes"("tenant_id", "admission_id", "created_at");

ALTER TABLE "nursing_vital_rounds"
    ADD CONSTRAINT "nursing_vital_rounds_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nursing_vital_rounds"
    ADD CONSTRAINT "nursing_vital_rounds_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nursing_notes"
    ADD CONSTRAINT "nursing_notes_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nursing_notes"
    ADD CONSTRAINT "nursing_notes_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
