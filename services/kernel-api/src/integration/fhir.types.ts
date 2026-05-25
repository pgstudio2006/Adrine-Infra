/** FHIR R4 metadata stub types — wire to full FHIR server later */
export type FhirCapabilityStatement = {
  resourceType: 'CapabilityStatement';
  status: 'draft';
  fhirVersion: '4.0.1';
  format: ['json'];
  rest: Array<{
    mode: 'server';
    resource: Array<{ type: string; interaction: Array<{ code: string }> }>;
  }>;
};

export const FHIR_METADATA_STUB: FhirCapabilityStatement = {
  resourceType: 'CapabilityStatement',
  status: 'draft',
  fhirVersion: '4.0.1',
  format: ['json'],
  rest: [
    {
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }] },
        { type: 'Encounter', interaction: [{ code: 'read' }] },
        { type: 'Observation', interaction: [{ code: 'read' }] },
      ],
    },
  ],
};
