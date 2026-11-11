import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    Put,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { MongoIdPipe } from '../pipes/mongo-id.pipe.js';
import { AuthGuard } from '../autenticacion/auth.guard.js';
import type { SolicitudAutenticada } from '../autenticacion/auth.guard.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

@Controller('publicaciones')
@UseGuards(AuthGuard)
export class PublicacionesController {
    constructor(private readonly publicacionesService: PublicacionesService) {}

    @Get()
    listar(@Query() consulta: ListarPublicacionesDto, @Req() request: SolicitudAutenticada) {
        return this.publicacionesService.listar(consulta, request.user.sub);
    }

    @Post()
    @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }))
    crear(
        @Body() datos: CrearPublicacionDto,
        @Req() request: SolicitudAutenticada,
        @UploadedFile(new ParseFilePipe({
            fileIsRequired: false,
            validators: [
                new MaxFileSizeValidator({
                    maxSize: TAMANO_MAXIMO_IMAGEN,
                    errorMessage: 'La imagen debe pesar menos de 5 MiB.',
                }),
                new FileTypeValidator({
                    fileType: /^image\/(jpeg|png|webp)$/,
                    errorMessage: 'La imagen debe ser un archivo JPEG, PNG o WebP válido.',
                }),
            ],
            exceptionFactory: mensaje => new BadRequestException(mensaje),
        }))
        imagen?: Express.Multer.File,
    ) {
        return this.publicacionesService.crear(request.user.sub, datos, imagen);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    eliminar(
        @Param('id', MongoIdPipe) id: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.eliminar(id, request.user.sub);
    }

    /* --- Me gusta --- */

    @Post(':id/me-gusta')
    @HttpCode(HttpStatus.OK)
    darMeGusta(
        @Param('id', MongoIdPipe) id: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.cambiarMeGusta(id, request.user.sub, true);
    }

    @Delete(':id/me-gusta')
    quitarMeGusta(
        @Param('id', MongoIdPipe) id: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.cambiarMeGusta(id, request.user.sub, false);
    }

    /* --- Comentarios --- */

    @Get(':id/comentarios')
    obtenerComentarios(
        @Param('id', MongoIdPipe) id: string,
        @Query() consulta: ListarComentariosDto,
    ) {
        return this.publicacionesService.obtenerComentarios(id, consulta);
    }

    @Post(':id/comentarios')
    crearComentario(
        @Param('id', MongoIdPipe) id: string,
        @Body() datos: CrearComentarioDto,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.crearComentario(id, request.user.sub, datos);
    }

    @Put(':id/comentarios/:comentarioId')
    actualizarComentario(
        @Param('id', MongoIdPipe) id: string,
        @Param('comentarioId', MongoIdPipe) comentarioId: string,
        @Body() datos: CrearComentarioDto,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.actualizarComentario(id, comentarioId, request.user.sub, datos);
    }

    @Delete(':id/comentarios/:comentarioId')
    @HttpCode(HttpStatus.NO_CONTENT)
    eliminarComentario(
        @Param('id', MongoIdPipe) id: string,
        @Param('comentarioId', MongoIdPipe) comentarioId: string,
        @Req() request: SolicitudAutenticada,
    ) {
        return this.publicacionesService.eliminarComentario(id, comentarioId, request.user.sub);
    }
}
