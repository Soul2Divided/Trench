import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AutenticacionModule } from './autenticacion/autenticacion.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const logger = new Logger('MongoDB');
                const uri = configService.get<string>('MONGODB_URI');

                if (!uri) {
                    throw new Error('Falta configurar MONGODB_URI.');
                }

                let host: string;

                try {
                    host = new URL(uri).hostname;
                } catch {
                    throw new Error('MONGODB_URI no tiene un formato válido.');
                }

                logger.log(`Conectando a MongoDB en ${host}.`);

                return {
                    uri,
                    serverSelectionTimeoutMS: 10000,
                    connectTimeoutMS: 10000,
                    retryAttempts: 1,
                    onConnectionCreate: (connection: Connection) => {
                        connection.once('connected', () => {
                            logger.log('Conexión a MongoDB establecida.');
                        });
                    },
                };
            },
        }),
        AutenticacionModule,
        UsuariosModule,
        PublicacionesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
