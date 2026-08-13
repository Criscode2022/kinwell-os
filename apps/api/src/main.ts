import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Kinwell API')
    .setDescription('Family caregiver OS — people, medications, adherence, appointments, tasks, journal.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  const webDistCandidates = [
    join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser'),
    join(__dirname, '..', 'public'),
    join(process.cwd(), '..', 'web', 'dist', 'web', 'browser'),
    join(process.cwd(), 'public'),
  ];
  const webDist = webDistCandidates.find((p) => existsSync(join(p, 'index.html')));
  if (webDist) {
    app.useStaticAssets(webDist);
    app.use((req: { method: string; path: string }, res: { sendFile: (p: string) => void }, next: () => void) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
        res.sendFile(join(webDist, 'index.html'));
        return;
      }
      next();
    });
  }

  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Kinwell API listening on http://${host}:${port}`);
}

bootstrap();
