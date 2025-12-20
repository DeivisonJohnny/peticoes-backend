import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as handlebars from 'handlebars';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Configuração CORS correta para httpOnly cookies
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://peticoes-worxbase.vercel.app',
      ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requisições sem origin (como Postman, curl, etc)
      if (!origin) return callback(null, true);

      // Remover barra final da origin para comparação
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const normalizedAllowedOrigins = allowedOrigins.map(o =>
        o.endsWith('/') ? o.slice(0, -1) : o
      );

      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ [CORS] Origem bloqueada: ${origin}`);
        console.warn(`⚠️ [CORS] Origens permitidas: ${normalizedAllowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API - Sistema de Petições')
    .setDescription(
      'Documentação detalhada da API do sistema de geração de petições.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  handlebars.registerHelper('formatDate', (dateString: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setUTCDate(date.getUTCDate() + 1);

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
