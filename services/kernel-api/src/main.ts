import { bootstrapOtel } from '@adrine/otel-bootstrap';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  bootstrapOtel('kernel-api');

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Adrine Kernel API')
    .setDescription('Platform kernel: auth, tenancy, audit, notifications, files, billing stubs.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
