import { bootstrapOtel } from '@adrine/otel-bootstrap';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurePlatformCors } from './configure-cors';

async function bootstrap() {
  bootstrapOtel('domain-api');

  const app = await NestFactory.create(AppModule);
  configurePlatformCors(app);

  const config = new DocumentBuilder()
    .setTitle('Adrine Domain API')
    .setDescription('Healthcare domain engines: patient, encounter, EMR-lite, scheduling, billing.')
    .setVersion('0.1.0')
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
}

bootstrap();
