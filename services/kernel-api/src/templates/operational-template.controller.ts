import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OperationalTemplateService } from './operational-template.service';

@ApiTags('templates')
@Controller('templates')
export class OperationalTemplateController {
  constructor(private readonly templates: OperationalTemplateService) {}

  @Get('catalog')
  catalog() {
    return this.templates.catalog();
  }

  @Post('instantiate')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  instantiate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { branchId: string; packCode: string },
  ) {
    return this.templates.instantiate(
      tenantId ?? 'tenant_dev',
      body.branchId,
      body.packCode,
    );
  }
}
