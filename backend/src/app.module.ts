import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AutenticacionModule } from './autenticacion/autenticacion.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI!),
        AutenticacionModule,
        UsuariosModule,
        PublicacionesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
