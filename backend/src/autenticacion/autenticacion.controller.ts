import {
    BadRequestException,
    Body,
    Controller,
    FileTypeValidator,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutenticacionService } from './autenticacion.service.js';
import { RegisterUsuarioDto } from './dto/register-usuario.dto.js';
import { LoginUsuarioDto } from './dto/login-usuario.dto.js';

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

@Controller('autenticacion')
export class AutenticacionController {
    constructor(private readonly autenticacionService: AutenticacionService) {}

    // Recibe los campos del registro y un archivo en el campo imagen.
    @Post('registro')
    @UseInterceptors(
        FileInterceptor('imagen', {
            limits: { fileSize: TAMANO_MAXIMO_IMAGEN },
        }),
    )
    registerUser(
        @Body() registerDto: RegisterUsuarioDto,
        @UploadedFile(
            new ParseFilePipe({
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
                exceptionFactory: (mensaje) => new BadRequestException(mensaje),
            }),
        )
        imagen: Express.Multer.File,
    ) {
        return this.autenticacionService.registerUser(registerDto, imagen);
    }

    @Post('login')
    loginUser(@Body() loginDto: LoginUsuarioDto) {
        return this.autenticacionService.loginUser(loginDto);
    }
}
