import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { FHIR_METADATA_STUB } from './fhir.types';
import { IntegrationService } from './integration.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integration: IntegrationService) {}

  @Post('api-keys')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  createKey(@Headers('x-tenant-id') tenantId: string, @Body() body: { name: string }) {
    return this.integration.createApiKey(tenantId ?? 'tenant_dev', body.name);
  }

  @Get('api-keys')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  listKeys(@Headers('x-tenant-id') tenantId: string) {
    return this.integration.listApiKeys(tenantId ?? 'tenant_dev');
  }

  @Post('webhooks')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  createWebhook(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { url: string; events: string[] },
  ) {
    return this.integration.createWebhook(tenantId ?? 'tenant_dev', body);
  }

  @Post('webhooks/:id/test')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  testWebhook(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.integration.testWebhook(tenantId ?? 'tenant_dev', id);
  }

  @Get('fhir/metadata')
  fhirMetadata() {
    return FHIR_METADATA_STUB;
  }

  @Post('fhir/Patient')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  fhirPatient(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      resourceType: 'Patient',
      id: `fhir-${Date.now()}`,
      tenantId: tenantId ?? 'tenant_dev',
      status: 'accepted_stub',
      received: body,
    };
  }
}
