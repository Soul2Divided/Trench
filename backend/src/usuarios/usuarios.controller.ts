import {
    BadRequestException,
    Body,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    ParseFilePipe,
    Patch,
    Req,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from '../autenticacion/auth.guard.js';
import type { SolicitudAutenticada } from '../autenticacion/auth.guard.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Get('mi-perfil')
    obtenerPerfil(@Req() request: SolicitudAutenticada) {
        return this.usuariosService.obtenerPorId(request.user.sub);
    }

    @Patch('mi-perfil')
    @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }))
    actualizarPerfil(
        @Req() request: SolicitudAutenticada,
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
        return this.usuariosService.actualizarPerfil(request.user.sub, datos, imagen);
    }
}
