import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FileModule } from '../file/file.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { MeGusta, MeGustaSchema } from './schemas/me-gusta.schema.js';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Publicacion.name, schema: PublicacionSchema },
            { name: Comentario.name, schema: ComentarioSchema },
            { name: MeGusta.name, schema: MeGustaSchema },
        ]),
        UsuariosModule,
        FileModule,
    ],
    controllers: [PublicacionesController],
    providers: [PublicacionesService],
})
export class PublicacionesModule {}
