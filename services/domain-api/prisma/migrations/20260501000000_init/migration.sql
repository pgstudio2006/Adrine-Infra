-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mrn" TEXT,
    "full_name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_visits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "appointment_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'intent',
    "previous_state" TEXT,
    "department" TEXT,
    "assigned_doctor" TEXT,
    "token_number" INTEGER,
    "complaint" TEXT,
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "escalation_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "opd_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd_visit_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opd_visit_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opd_visit_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "resource_label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_resources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL DEFAULT 'doctor',
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduling_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_waitlist" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "resource_label" TEXT NOT NULL,
    "preferred_start" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "appointment_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new_inquiry',
    "specialty" TEXT,
    "package_name" TEXT,
    "owner_label" TEXT,
    "channel" TEXT,
    "value_cents" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reach_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_lifecycle_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "journey" TEXT,
    "owner_label" TEXT,
    "risk_level" TEXT,
    "next_step" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "opd_visit_id" TEXT,
    "ipd_admission_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "paid_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gst_rate_bps" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "payment_method" TEXT,
    "receipt_number" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "corporate_payer" BOOLEAN NOT NULL DEFAULT false,
    "insurance_mode" TEXT NOT NULL DEFAULT 'self',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_charge_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "charge_code" TEXT,
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source_module" TEXT NOT NULL,
    "source_action" TEXT NOT NULL,
    "source_ref_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "invoice_charge_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "reason" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_diagnostic_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "opd_visit_id" TEXT,
    "external_ref" TEXT,
    "tests" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "ordering_doctor" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ordered',
    "sample_id" TEXT,
    "sample_barcode" TEXT,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "critical_ack_at" TIMESTAMP(3),
    "results" JSONB,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_charge_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lab_diagnostic_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_order_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_study_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "opd_visit_id" TEXT,
    "external_ref" TEXT,
    "study" TEXT NOT NULL,
    "modality" TEXT NOT NULL DEFAULT 'X-Ray',
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "ordering_doctor" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ordered',
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "critical_ack_at" TIMESTAMP(3),
    "report" JSONB,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_charge_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "radiology_study_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_order_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "radiology_order_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radiology_order_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_stock_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "drug" TEXT NOT NULL,
    "generic" TEXT NOT NULL DEFAULT '',
    "batch" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "qty_on_hand" INTEGER NOT NULL,
    "qty_reserved" INTEGER NOT NULL DEFAULT 0,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "unit_price_cents" INTEGER NOT NULL DEFAULT 12000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_fulfillments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "opd_visit_id" TEXT,
    "external_ref" TEXT,
    "prescribing_doctor" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "medications" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'prescribed',
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "controlled_approved" BOOLEAN NOT NULL DEFAULT false,
    "dispensed_snapshot" JSONB,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_charge_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "pharmacy_fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_fulfillment_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fulfillment_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_fulfillment_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_inventory_reservations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fulfillment_id" TEXT NOT NULL,
    "stock_item_id" TEXT NOT NULL,
    "qty_reserved" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "pharmacy_inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ward_type" TEXT NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bed_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "bed_unit_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'available',
    "current_admission_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bed_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_admissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "opd_visit_id" TEXT,
    "bed_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'admission_requested',
    "previous_state" TEXT,
    "ward" TEXT,
    "attending_doctor" TEXT,
    "admission_source" TEXT,
    "primary_diagnosis" TEXT,
    "insurance_mode" TEXT NOT NULL DEFAULT 'self',
    "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
    "external_ref" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "admitted_at" TIMESTAMP(3),
    "discharged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipd_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_admission_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipd_admission_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_to" TEXT,
    "state" TEXT NOT NULL DEFAULT 'scheduled',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nursing_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_task_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nursing_task_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nursing_task_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_vital_rounds" (
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

-- CreateTable
CREATE TABLE "nursing_notes" (
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

-- CreateTable
CREATE TABLE "medication_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "drug" TEXT NOT NULL,
    "dosage" TEXT NOT NULL DEFAULT '',
    "route" TEXT NOT NULL DEFAULT 'PO',
    "frequency" TEXT NOT NULL DEFAULT '',
    "scheduled_at" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'scheduled',
    "ordered_by" TEXT,
    "nursing_task_id" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "administered_at" TIMESTAMP(3),
    "held_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_admin_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "medication_schedule_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_admin_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discharge_orchestrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'initiated',
    "clinical_cleared_at" TIMESTAMP(3),
    "billing_cleared_at" TIMESTAMP(3),
    "pharmacy_cleared_at" TIMESTAMP(3),
    "nursing_cleared_at" TIMESTAMP(3),
    "insurance_cleared_at" TIMESTAMP(3),
    "ready_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discharge_orchestrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discharge_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "discharge_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discharge_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_authorizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "payer_name" TEXT,
    "policy_number" TEXT,
    "state" TEXT NOT NULL DEFAULT 'initiated',
    "approved_cents" INTEGER,
    "settled_cents" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "insurance_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lifecycle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "draft_json" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "expected_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_publish_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "from_version" INTEGER NOT NULL,
    "to_version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_branch_overrides" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "lifecycle_id" TEXT NOT NULL,
    "workflow_version_id" TEXT NOT NULL,
    "override_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_branch_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_escalations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source_runtime" TEXT NOT NULL,
    "resource_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'open',
    "message" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_cases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "ipd_admission_id" TEXT,
    "ot_room_id" TEXT,
    "procedure_name" TEXT NOT NULL,
    "surgeon_name" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'elective',
    "scheduled_at" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'scheduled',
    "external_ref" TEXT,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_charge_key" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ot_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_case_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ot_case_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_case_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_catalog_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "qty_on_hand" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "unit_cost_cents" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_moves" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    "move_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "from_location" TEXT,
    "to_location" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "external_ref" TEXT,
    "requested_by" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_move_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "stock_move_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_stock_move_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_machines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'available',
    "hours_run" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialysis_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "ipd_admission_id" TEXT,
    "machine_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'scheduled',
    "package_code" TEXT,
    "external_ref" TEXT,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_charge_key" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialysis_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_session_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT NOT NULL,
    "to_state" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dialysis_session_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "file_name" TEXT,
    "mapping" JSONB,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job_rows" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "row_index" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errors" JSONB,
    "entity_id" TEXT,

    CONSTRAINT "import_job_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_mapping_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_mapping_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template_code" TEXT,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "outbox_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_action_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tenant_quotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "monthly_token_cap" INTEGER NOT NULL DEFAULT 100000,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tenant_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_tenant_id_created_at_idx" ON "patients"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "opd_visits_tenant_id_branch_id_state_idx" ON "opd_visits"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "opd_visits_tenant_id_patient_id_created_at_idx" ON "opd_visits"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE INDEX "opd_visit_transitions_tenant_id_opd_visit_id_created_at_idx" ON "opd_visit_transitions"("tenant_id", "opd_visit_id", "created_at");

-- CreateIndex
CREATE INDEX "platform_events_tenant_id_event_name_created_at_idx" ON "platform_events"("tenant_id", "event_name", "created_at");

-- CreateIndex
CREATE INDEX "platform_events_tenant_id_resource_type_resource_id_idx" ON "platform_events"("tenant_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "encounters_tenant_id_patient_id_idx" ON "encounters"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "clinical_notes_tenant_id_encounter_id_idx" ON "clinical_notes"("tenant_id", "encounter_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_start_at_idx" ON "appointments"("tenant_id", "start_at");

-- CreateIndex
CREATE INDEX "scheduling_resources_tenant_id_branch_id_is_active_idx" ON "scheduling_resources"("tenant_id", "branch_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "scheduling_resources_tenant_id_branch_id_code_key" ON "scheduling_resources"("tenant_id", "branch_id", "code");

-- CreateIndex
CREATE INDEX "scheduling_waitlist_tenant_id_branch_id_status_idx" ON "scheduling_waitlist"("tenant_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "crm_leads_tenant_id_branch_id_stage_idx" ON "crm_leads"("tenant_id", "branch_id", "stage");

-- CreateIndex
CREATE INDEX "crm_leads_tenant_id_status_idx" ON "crm_leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "crm_campaigns_tenant_id_branch_id_status_idx" ON "crm_campaigns"("tenant_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "crm_lifecycle_events_tenant_id_patient_id_created_at_idx" ON "crm_lifecycle_events"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_receipt_number_key" ON "invoices"("receipt_number");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_opd_visit_id_idx" ON "invoices"("tenant_id", "opd_visit_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_ipd_admission_id_idx" ON "invoices"("tenant_id", "ipd_admission_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_created_at_idx" ON "invoices"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "invoice_charge_lines_invoice_id_status_idx" ON "invoice_charge_lines"("invoice_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_charge_lines_tenant_id_idempotency_key_key" ON "invoice_charge_lines"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "invoice_transitions_tenant_id_invoice_id_created_at_idx" ON "invoice_transitions"("tenant_id", "invoice_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_records_tenant_id_invoice_id_idx" ON "payment_records"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "lab_diagnostic_orders_tenant_id_opd_visit_id_state_idx" ON "lab_diagnostic_orders"("tenant_id", "opd_visit_id", "state");

-- CreateIndex
CREATE INDEX "lab_diagnostic_orders_tenant_id_patient_id_created_at_idx" ON "lab_diagnostic_orders"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE INDEX "lab_order_transitions_tenant_id_lab_order_id_created_at_idx" ON "lab_order_transitions"("tenant_id", "lab_order_id", "created_at");

-- CreateIndex
CREATE INDEX "radiology_study_orders_tenant_id_opd_visit_id_state_idx" ON "radiology_study_orders"("tenant_id", "opd_visit_id", "state");

-- CreateIndex
CREATE INDEX "radiology_study_orders_tenant_id_patient_id_created_at_idx" ON "radiology_study_orders"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE INDEX "radiology_order_transitions_tenant_id_radiology_order_id_cr_idx" ON "radiology_order_transitions"("tenant_id", "radiology_order_id", "created_at");

-- CreateIndex
CREATE INDEX "pharmacy_stock_items_tenant_id_branch_id_drug_idx" ON "pharmacy_stock_items"("tenant_id", "branch_id", "drug");

-- CreateIndex
CREATE INDEX "pharmacy_fulfillments_tenant_id_opd_visit_id_state_idx" ON "pharmacy_fulfillments"("tenant_id", "opd_visit_id", "state");

-- CreateIndex
CREATE INDEX "pharmacy_fulfillments_tenant_id_patient_id_created_at_idx" ON "pharmacy_fulfillments"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE INDEX "pharmacy_fulfillment_transitions_tenant_id_fulfillment_id_c_idx" ON "pharmacy_fulfillment_transitions"("tenant_id", "fulfillment_id", "created_at");

-- CreateIndex
CREATE INDEX "pharmacy_inventory_reservations_tenant_id_fulfillment_id_st_idx" ON "pharmacy_inventory_reservations"("tenant_id", "fulfillment_id", "status");

-- CreateIndex
CREATE INDEX "bed_units_tenant_id_branch_id_idx" ON "bed_units"("tenant_id", "branch_id");

-- CreateIndex
CREATE INDEX "beds_tenant_id_branch_id_state_idx" ON "beds"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "beds_tenant_id_branch_id_label_key" ON "beds"("tenant_id", "branch_id", "label");

-- CreateIndex
CREATE INDEX "bed_transitions_tenant_id_bed_id_created_at_idx" ON "bed_transitions"("tenant_id", "bed_id", "created_at");

-- CreateIndex
CREATE INDEX "ipd_admissions_tenant_id_branch_id_state_idx" ON "ipd_admissions"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "ipd_admissions_tenant_id_patient_id_created_at_idx" ON "ipd_admissions"("tenant_id", "patient_id", "created_at");

-- CreateIndex
CREATE INDEX "ipd_admission_transitions_tenant_id_admission_id_created_at_idx" ON "ipd_admission_transitions"("tenant_id", "admission_id", "created_at");

-- CreateIndex
CREATE INDEX "nursing_tasks_tenant_id_admission_id_state_idx" ON "nursing_tasks"("tenant_id", "admission_id", "state");

-- CreateIndex
CREATE INDEX "nursing_task_transitions_tenant_id_nursing_task_id_created__idx" ON "nursing_task_transitions"("tenant_id", "nursing_task_id", "created_at");

-- CreateIndex
CREATE INDEX "nursing_vital_rounds_tenant_id_admission_id_recorded_at_idx" ON "nursing_vital_rounds"("tenant_id", "admission_id", "recorded_at");

-- CreateIndex
CREATE INDEX "nursing_notes_tenant_id_admission_id_created_at_idx" ON "nursing_notes"("tenant_id", "admission_id", "created_at");

-- CreateIndex
CREATE INDEX "medication_schedules_tenant_id_admission_id_state_idx" ON "medication_schedules"("tenant_id", "admission_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "medication_schedules_tenant_id_nursing_task_id_key" ON "medication_schedules"("tenant_id", "nursing_task_id");

-- CreateIndex
CREATE INDEX "medication_admin_transitions_tenant_id_medication_schedule__idx" ON "medication_admin_transitions"("tenant_id", "medication_schedule_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "discharge_orchestrations_admission_id_key" ON "discharge_orchestrations"("admission_id");

-- CreateIndex
CREATE INDEX "discharge_orchestrations_tenant_id_state_idx" ON "discharge_orchestrations"("tenant_id", "state");

-- CreateIndex
CREATE INDEX "discharge_transitions_tenant_id_discharge_id_created_at_idx" ON "discharge_transitions"("tenant_id", "discharge_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_authorizations_admission_id_key" ON "insurance_authorizations"("admission_id");

-- CreateIndex
CREATE INDEX "insurance_authorizations_tenant_id_state_idx" ON "insurance_authorizations"("tenant_id", "state");

-- CreateIndex
CREATE INDEX "insurance_transitions_tenant_id_insurance_id_created_at_idx" ON "insurance_transitions"("tenant_id", "insurance_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_tenant_id_lifecycle_id_key" ON "workflow_definitions"("tenant_id", "lifecycle_id");

-- CreateIndex
CREATE INDEX "workflow_versions_tenant_id_definition_id_state_idx" ON "workflow_versions"("tenant_id", "definition_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_definition_id_version_key" ON "workflow_versions"("definition_id", "version");

-- CreateIndex
CREATE INDEX "workflow_publish_logs_tenant_id_definition_id_created_at_idx" ON "workflow_publish_logs"("tenant_id", "definition_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_branch_overrides_tenant_id_branch_id_lifecycle_id_key" ON "workflow_branch_overrides"("tenant_id", "branch_id", "lifecycle_id");

-- CreateIndex
CREATE INDEX "operational_escalations_tenant_id_branch_id_state_idx" ON "operational_escalations"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "operational_escalations_tenant_id_type_created_at_idx" ON "operational_escalations"("tenant_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "ot_rooms_tenant_id_branch_id_state_idx" ON "ot_rooms"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ot_rooms_tenant_id_branch_id_code_key" ON "ot_rooms"("tenant_id", "branch_id", "code");

-- CreateIndex
CREATE INDEX "ot_cases_tenant_id_branch_id_state_idx" ON "ot_cases"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "ot_cases_tenant_id_patient_id_scheduled_at_idx" ON "ot_cases"("tenant_id", "patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "ot_case_transitions_tenant_id_ot_case_id_created_at_idx" ON "ot_case_transitions"("tenant_id", "ot_case_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_catalog_items_tenant_id_branch_id_category_idx" ON "inventory_catalog_items"("tenant_id", "branch_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_catalog_items_tenant_id_branch_id_sku_key" ON "inventory_catalog_items"("tenant_id", "branch_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_stock_moves_tenant_id_branch_id_state_idx" ON "inventory_stock_moves"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "inventory_stock_moves_tenant_id_catalog_item_id_created_at_idx" ON "inventory_stock_moves"("tenant_id", "catalog_item_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_stock_move_transitions_tenant_id_stock_move_id_cr_idx" ON "inventory_stock_move_transitions"("tenant_id", "stock_move_id", "created_at");

-- CreateIndex
CREATE INDEX "dialysis_machines_tenant_id_branch_id_state_idx" ON "dialysis_machines"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "dialysis_machines_tenant_id_branch_id_code_key" ON "dialysis_machines"("tenant_id", "branch_id", "code");

-- CreateIndex
CREATE INDEX "dialysis_sessions_tenant_id_branch_id_state_idx" ON "dialysis_sessions"("tenant_id", "branch_id", "state");

-- CreateIndex
CREATE INDEX "dialysis_sessions_tenant_id_patient_id_scheduled_at_idx" ON "dialysis_sessions"("tenant_id", "patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "dialysis_session_transitions_tenant_id_session_id_created_a_idx" ON "dialysis_session_transitions"("tenant_id", "session_id", "created_at");

-- CreateIndex
CREATE INDEX "import_jobs_tenant_id_type_status_idx" ON "import_jobs"("tenant_id", "type", "status");

-- CreateIndex
CREATE INDEX "import_job_rows_job_id_status_idx" ON "import_job_rows"("job_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "import_mapping_templates_tenant_id_type_name_key" ON "import_mapping_templates"("tenant_id", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_code_channel_key" ON "notification_templates"("tenant_id", "code", "channel");

-- CreateIndex
CREATE INDEX "notification_outbox_tenant_id_status_next_retry_at_idx" ON "notification_outbox"("tenant_id", "status", "next_retry_at");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_action_type_created_at_idx" ON "ai_action_logs"("tenant_id", "action_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_tenant_quotas_tenant_id_key" ON "ai_tenant_quotas"("tenant_id");

-- AddForeignKey
ALTER TABLE "opd_visits" ADD CONSTRAINT "opd_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opd_visit_transitions" ADD CONSTRAINT "opd_visit_transitions_opd_visit_id_fkey" FOREIGN KEY ("opd_visit_id") REFERENCES "opd_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_waitlist" ADD CONSTRAINT "scheduling_waitlist_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_waitlist" ADD CONSTRAINT "scheduling_waitlist_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_lifecycle_events" ADD CONSTRAINT "crm_lifecycle_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_charge_lines" ADD CONSTRAINT "invoice_charge_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_transitions" ADD CONSTRAINT "invoice_transitions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_diagnostic_orders" ADD CONSTRAINT "lab_diagnostic_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_transitions" ADD CONSTRAINT "lab_order_transitions_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_diagnostic_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_study_orders" ADD CONSTRAINT "radiology_study_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_order_transitions" ADD CONSTRAINT "radiology_order_transitions_radiology_order_id_fkey" FOREIGN KEY ("radiology_order_id") REFERENCES "radiology_study_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_fulfillments" ADD CONSTRAINT "pharmacy_fulfillments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_fulfillment_transitions" ADD CONSTRAINT "pharmacy_fulfillment_transitions_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "pharmacy_fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_inventory_reservations" ADD CONSTRAINT "pharmacy_inventory_reservations_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "pharmacy_fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_inventory_reservations" ADD CONSTRAINT "pharmacy_inventory_reservations_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "pharmacy_stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_bed_unit_id_fkey" FOREIGN KEY ("bed_unit_id") REFERENCES "bed_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bed_transitions" ADD CONSTRAINT "bed_transitions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admissions" ADD CONSTRAINT "ipd_admissions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_admission_transitions" ADD CONSTRAINT "ipd_admission_transitions_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_tasks" ADD CONSTRAINT "nursing_tasks_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_tasks" ADD CONSTRAINT "nursing_tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_task_transitions" ADD CONSTRAINT "nursing_task_transitions_nursing_task_id_fkey" FOREIGN KEY ("nursing_task_id") REFERENCES "nursing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_vital_rounds" ADD CONSTRAINT "nursing_vital_rounds_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_vital_rounds" ADD CONSTRAINT "nursing_vital_rounds_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_admin_transitions" ADD CONSTRAINT "medication_admin_transitions_medication_schedule_id_fkey" FOREIGN KEY ("medication_schedule_id") REFERENCES "medication_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_orchestrations" ADD CONSTRAINT "discharge_orchestrations_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_orchestrations" ADD CONSTRAINT "discharge_orchestrations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_transitions" ADD CONSTRAINT "discharge_transitions_discharge_id_fkey" FOREIGN KEY ("discharge_id") REFERENCES "discharge_orchestrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "ipd_admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_authorizations" ADD CONSTRAINT "insurance_authorizations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_transitions" ADD CONSTRAINT "insurance_transitions_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "insurance_authorizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_publish_logs" ADD CONSTRAINT "workflow_publish_logs_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "workflow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_cases" ADD CONSTRAINT "ot_cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_cases" ADD CONSTRAINT "ot_cases_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_cases" ADD CONSTRAINT "ot_cases_ot_room_id_fkey" FOREIGN KEY ("ot_room_id") REFERENCES "ot_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_case_transitions" ADD CONSTRAINT "ot_case_transitions_ot_case_id_fkey" FOREIGN KEY ("ot_case_id") REFERENCES "ot_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_moves" ADD CONSTRAINT "inventory_stock_moves_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "inventory_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_move_transitions" ADD CONSTRAINT "inventory_stock_move_transitions_stock_move_id_fkey" FOREIGN KEY ("stock_move_id") REFERENCES "inventory_stock_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialysis_sessions" ADD CONSTRAINT "dialysis_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialysis_sessions" ADD CONSTRAINT "dialysis_sessions_ipd_admission_id_fkey" FOREIGN KEY ("ipd_admission_id") REFERENCES "ipd_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialysis_sessions" ADD CONSTRAINT "dialysis_sessions_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "dialysis_machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialysis_session_transitions" ADD CONSTRAINT "dialysis_session_transitions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "dialysis_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_outbox_id_fkey" FOREIGN KEY ("outbox_id") REFERENCES "notification_outbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
