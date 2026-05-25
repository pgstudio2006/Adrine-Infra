import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('files')
@Controller('files')
export class FileController {
  @Post('presign')
  presign(@Body() body: { key: string; contentType?: string }) {
    return {
      uploadUrl: `https://s3.example-bucket/${body.key}?stub=true`,
      note: 'Stub presign — implement SigV4 against tenant-scoped KMS envelope keys.',
      contentType: body.contentType ?? 'application/octet-stream',
    };
  }
}
