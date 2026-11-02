import { Module } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { FileModule } from '../file/file.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';

@Module({
    imports: [UsuariosModule, FileModule],
    controllers: [AutenticacionController],
    providers: [
        AutenticacionService,
        {
            provide: PasswordHasher,
            useFactory: () => new PasswordHasher(),
        },
    ],
})
export class AutenticacionModule {}
