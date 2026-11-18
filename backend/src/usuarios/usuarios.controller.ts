import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from '../autenticacion/auth.guard.js';
import { AdministradorGuard } from '../autenticacion/administrador.guard.js';
import { MongoIdPipe } from '../pipes/mongo-id.pipe.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
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

    @Get()
    @UseGuards(AdministradorGuard)
    listar() {
        return this.usuariosService.listar();
    }

    @Post()
    @UseGuards(AdministradorGuard)
    @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }))
    crear(
        @Body() datos: CrearUsuarioDto,
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
        return this.usuariosService.crear(datos, imagen, datos.rol);
    }

    @Delete(':id')
    @UseGuards(AdministradorGuard)
    deshabilitar(
        @Param('id', MongoIdPipe) id: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.usuariosService.cambiarHabilitacion(id, false, request.user.sub);
    }

    @Post(':id/habilitar')
    @UseGuards(AdministradorGuard)
    @HttpCode(HttpStatus.OK)
    habilitar(
        @Param('id', MongoIdPipe) id: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.usuariosService.cambiarHabilitacion(id, true, request.user.sub);
    }
}
