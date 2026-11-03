import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    logger.log(`Iniciando backend con Node ${process.version}.`);

    const app = await NestFactory.create(AppModule);

    app.enableCors({
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

    logger.log('Backend listo para recibir peticiones.');
}
await bootstrap();
