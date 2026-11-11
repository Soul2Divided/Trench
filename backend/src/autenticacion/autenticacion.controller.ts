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
    Req,
    Res,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutenticacionService } from './autenticacion.service.js';
import { RegisterUsuarioDto } from './dto/register-usuario.dto.js';
import { LoginUsuarioDto } from './dto/login-usuario.dto.js';
import { AuthGuard } from './auth.guard.js';
import type { SolicitudAutenticada } from './auth.guard.js';
import type { Response } from 'express';

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
    async registerUser(
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
        @Res({ passthrough: true }) res: Response,
    ) {
        const { token, ...usuario } = await this.autenticacionService.registerUser(registerDto, imagen);
        const tiempos = this.autenticacionService.setTokenCookie(res, token);

        return { ...usuario, ...tiempos };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async loginUser(
        @Body() loginDto: LoginUsuarioDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { token, ...usuario } = await this.autenticacionService.loginUser(loginDto);
        const tiempos = this.autenticacionService.setTokenCookie(res, token);

        return { ...usuario, ...tiempos };
    }

    @Post('autorizar')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async autorizar(@Req() request: SolicitudAutenticada) {
        const usuario = await this.autenticacionService.autorizar(request.user.sub);
        const tiempos = this.autenticacionService.tiemposSesion(request.user);

        return { ...usuario, ...tiempos };
    }

    @Post('refrescar')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async refrescar(
        @Req() request: SolicitudAutenticada,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { token, ...usuario } = await this.autenticacionService.refrescar(request.user.sub);
        const tiempos = this.autenticacionService.setTokenCookie(res, token);

        return { ...usuario, ...tiempos };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    cerrarSesion(@Res({ passthrough: true }) res: Response) {
        this.autenticacionService.cerrarSesion(res);

        return { mensaje: 'Sesión cerrada.' };
    }
}
