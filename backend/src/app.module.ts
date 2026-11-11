import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AutenticacionModule } from './autenticacion/autenticacion.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

@Module({
    imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '30s',
                // expiresIn: '15m',
            },
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI!),
        AutenticacionModule,
        UsuariosModule,
        PublicacionesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
