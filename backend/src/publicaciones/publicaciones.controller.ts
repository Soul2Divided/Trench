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
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { MongoIdPipe } from '../pipes/mongo-id.pipe.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly publicacionesService: PublicacionesService) {}

    @Get()
    listar(@Query() consulta: ListarPublicacionesDto) {
        return this.publicacionesService.listar(consulta);
    }

    @Get(':id/comentarios')
    obtenerComentarios(@Param('id', MongoIdPipe) id: string) {
        return this.publicacionesService.obtenerComentarios(id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }))
    crear(
        @Body() datos: CrearPublicacionDto,
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
        return this.publicacionesService.crear(datos, imagen);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    eliminar(
        @Param('id', MongoIdPipe) id: string,
        @Query('usuarioId', MongoIdPipe) usuarioId: string,
    ) {
        return this.publicacionesService.eliminar(id, usuarioId);
    }
}
