# Agent F — MSK Clinical (UAT scope)

## DONE (tonight / UAT path)

| Task | Artifact |
|------|----------|
| Calculator field type + ODI, NDI, WOMAC, KOOS, DASH, SPADI, Harris Hip, VAS | `apps/hospital-os/src/lib/navayu/msk-calculators.ts`, `NavayuMetadataForm.tsx` |
| Regional exam FormDefinitions + workflow `formBindings` | `clients/navayu/forms/msk-*-v0.json`, `workflow/navayu_msk_visit.json` |
| Metadata-driven renderer (no new Navayu pages) | `NavayuMetadataForm`, `NavayuMskExamPanel`, wired in `DoctorConsultation.tsx` |
| Pain map on registration | `registration-v0.json` (`pain_map`), `NavayuMetadataForm` |
| Investigation upload API + UI | `POST /opd/visits/:id/investigations/upload`, `NavayuInvestigationsPanel.tsx` |
| Protocol mapping from `protocols.json` | `NavayuProtocolMapPanel.tsx`, `branch-config.getServerTenantProtocols()` |
| AI summary rule-based v1 + LLM when env set | `navayu-summary.ts`, `POST /opd/visits/:id/ai-summary`, `NavayuAiSummaryPanel.tsx` |

## BLOCKED

| Item | Reason | Exact file / env |
|------|--------|------------------|
| Full validated ODI/NDI/WOMAC questionnaires (licensed item banks) | Simplified UAT calculators only | `apps/hospital-os/src/lib/navayu/msk-calculators.ts` |
| Durable file/blob storage for imaging | Upload metadata stub on visit JSON (2MB cap); no S3/Blob service | `services/domain-api/src/opd/opd.service.ts` (`uploadInvestigation`) |
| AI Gateway routed LLM | `AI_GATEWAY_URL` alone — stub router only | `services/ai-gateway/app/main.py` |
| LLM without OpenRouter | Requires `OPENROUTER_API_KEY` on **domain-api** | `services/domain-api/src/opd/opd.service.ts` (`generateNavayuAiSummary`) |
| Admin FormDefinition publish API | BranchConfig `tenant.forms` seed only | `docs/ADRINE_PLATFORM_VISION.md` §4.1 |
| Interactive body diagram (SVG) | `pain_map` = region button grid | `NavayuMetadataForm.tsx` |
| MRI AI summarize (AI-3) | No imaging NLP pipeline | `clients/navayu/NAVAYU_IMPLEMENTATION_SPEC.md` §7.2 |
