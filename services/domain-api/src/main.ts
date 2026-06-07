import { bootstrapOtel } from '@adrine/otel-bootstrap';
import { assertProductionSecurityEnv } from '@adrine/hospital-operations';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configurePlatformCors } from './configure-cors';

async function bootstrap() {
  assertProductionSecurityEnv('domain-api');
  bootstrapOtel('domain-api');

  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  configurePlatformCors(app);

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Adrine Domain API')
      .setDescription('Healthcare domain engines: patient, encounter, EMR-lite, scheduling, billing.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
}

bootstrap();
