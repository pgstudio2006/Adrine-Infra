import { bootstrapOtel } from '@adrine/otel-bootstrap';
import { assertProductionSecurityEnv } from '@adrine/hospital-operations';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configurePlatformCors } from './configure-cors';

async function bootstrap() {
  assertProductionSecurityEnv('kernel-api');
  bootstrapOtel('kernel-api');

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
      .setTitle('Adrine Kernel API')
      .setDescription('Platform kernel: auth, tenancy, audit, notifications, files, billing stubs.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
