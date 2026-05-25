import { Global, Module } from '@nestjs/common';
import { ProviderRuntimeService } from './provider-runtime.service';

@Global()
@Module({
  providers: [ProviderRuntimeService],
  exports: [ProviderRuntimeService],
})
export class ProvidersModule {}
