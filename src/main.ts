import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/webhook/stripe', bodyParser.raw({ type: 'application/json' }));
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints).join(', '),
        );
        return new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
