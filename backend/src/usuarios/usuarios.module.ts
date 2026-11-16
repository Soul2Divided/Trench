import { Module } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../autenticacion/auth.guard.js';
import { AdministradorGuard } from '../autenticacion/administrador.guard.js';
import { FileModule } from '../file/file.module.js';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
        FileModule,
    ],
    controllers: [UsuariosController],
    providers: [
        UsuariosService,
        AuthGuard,
        AdministradorGuard,
        {
            provide: PasswordHasher,
            useFactory: () => new PasswordHasher(),
        },
    ],
    exports: [UsuariosService],
})
export class UsuariosModule {}
