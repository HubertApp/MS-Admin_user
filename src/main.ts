import './otel-setup';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    process.env.NODE_ENV === 'production'
      ? helmet()
      : helmet({ contentSecurityPolicy: false }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
