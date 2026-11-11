import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    const origenesPermitidos = [
        'http://localhost:4200',
        'https://trench-angular.vercel.app',
    ];

    // Las cookies entre sitios requieren controlar el origen de las operaciones que modifican datos.
    app.use((req: Request, res: Response, next: NextFunction) => {
        const origen = req.headers.origin;

        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origen && !origenesPermitidos.includes(origen)) {
            res.status(403).json({ message: 'El origen de la solicitud no está permitido.' });

            return;
        }

        next();
    });

    app.enableCors({
        credentials: true,
        origin: origenesPermitidos,
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
