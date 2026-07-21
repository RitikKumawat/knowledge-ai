import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Response } from 'express';
import * as express from 'express';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { graphqlUploadExpress } from 'graphql-upload-ts';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10_000_000,
      maxFiles: 10,
    }),
  );

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Activate all class-validator decorators (@Matches, @IsString, @IsOptional, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.use(cookieParser());
  const staticOptions = {
    setHeaders: (res: Response) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );
    },
  };

  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), staticOptions),
  );
  app.use(
    '/upload',
    express.static(
      join(process.cwd(), 'uploads', 'assessment-files'),
      staticOptions,
    ),
  );
  app.enableCors({
    credentials: true,
    origin: [process.env.CLIENT_URL ?? ''.split(',')],
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
