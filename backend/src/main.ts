import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
        credentials: true,
        origin: [
            'http://localhost:4200',
            'https://trench-angular.vercel.app',
        ],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            validationError: {
                target: false,
                value: false,
            },
        }),
    );

    await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
