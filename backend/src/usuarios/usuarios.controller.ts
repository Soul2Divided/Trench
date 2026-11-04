import {
    BadRequestException,
    Body,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Patch,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { MongoIdPipe } from '../pipes/mongo-id.pipe.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Get(':id')
    obtenerPorId(@Param('id', MongoIdPipe) id: string) {
        return this.usuariosService.obtenerPorId(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }))
    actualizarPerfil(
        @Param('id', MongoIdPipe) id: string,
        @Body() datos: ActualizarPerfilDto,
        @UploadedFile(new ParseFilePipe({
            fileIsRequired: false,
            validators: [
                new MaxFileSizeValidator({
                    maxSize: TAMANO_MAXIMO_IMAGEN,
                    errorMessage: 'La imagen de perfil debe pesar menos de 5 MiB.',
                }),
                new FileTypeValidator({
                    fileType: /^image\/(jpeg|png|webp)$/,
                    errorMessage: 'La imagen de perfil debe ser un archivo JPEG, PNG o WebP válido.',
                }),
            ],
            exceptionFactory: mensaje => new BadRequestException(mensaje),
        }))
        imagen?: Express.Multer.File,
    ) {
        return this.usuariosService.actualizarPerfil(id, datos, imagen);
    }
}
