import { PasswordHasher } from '@nestjs/authentication';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterUsuarioDto } from './dto/register-usuario.dto.js';
import { LoginUsuarioDto } from './dto/login-usuario.dto.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import type { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { CloudinaryService } from '../file/cloudinary.service.js';

@Injectable()
export class AutenticacionService {
    private readonly opcionesCookie: CookieOptions = {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    };

    constructor(
        private readonly passwordHasher: PasswordHasher,
        private readonly usuariosService: UsuariosService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly jwtService: JwtService,
    ) { }

    async registerUser(registerDto: RegisterUsuarioDto, imagen: Express.Multer.File) {
        if (registerDto.contrasena !== registerDto.repetirContrasena) {
            throw new BadRequestException('Las contraseñas no coinciden.');
        }

        const usuarioPorCorreo = await this.usuariosService.findByCorreo(registerDto.correo);

        if (usuarioPorCorreo) {
            throw new ConflictException('El correo ya está registrado.');
        }

        const usuarioPorNombre = await this.usuariosService.findByNombreUsuario(registerDto.nombreUsuario);

        if (usuarioPorNombre) {
            throw new ConflictException('El nombre de usuario ya está registrado.');
        }

        const contrasenaHash = await this.passwordHasher.hash(registerDto.contrasena);
        const imagenSubida = await this.cloudinaryService.subirImagen(imagen.buffer);
        let usuario: UsuarioDocument;

        try {
            usuario = await this.usuariosService.saveUser({
                nombre: registerDto.nombre,
                apellido: registerDto.apellido,
                correo: registerDto.correo,
                nombreUsuario: registerDto.nombreUsuario,
                contrasenaHash,
                fechaNacimiento: new Date(registerDto.fechaNacimiento),
                descripcion: registerDto.descripcion,
                imagenPerfilUrl: imagenSubida.secure_url,
                imagenPerfilPublicId: imagenSubida.public_id,
            });
        } catch (error: unknown) {
            try {
                await this.cloudinaryService.eliminarImagen(imagenSubida.public_id);
            } catch {
                console.log('No se pudo eliminar la imagen de un registro fallido.');
            }

            throw error;
        }

        return {
            token: await this.generateToken(usuario),
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento,
            descripcion: usuario.descripcion,
            imagenPerfilUrl: usuario.imagenPerfilUrl,
            rol: usuario.rol,
        };
    }

    async loginUser(loginDto: LoginUsuarioDto) {
        const usuario = await this.usuariosService.findByCorreoConContrasena(loginDto.correo);

        const contrasenaValida = await this.passwordHasher.verify(
            loginDto.contrasena,
            usuario?.contrasenaHash,
        );

        if (!usuario || !contrasenaValida) {
            throw new UnauthorizedException('El correo o la contraseña son incorrectos.');
        }

        return {
            token: await this.generateToken(usuario),
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento,
            descripcion: usuario.descripcion,
            imagenPerfilUrl: usuario.imagenPerfilUrl,
            rol: usuario.rol,
        };
    }

    async autorizar(id: string) {
        try {
            return await this.usuariosService.obtenerPorId(id);
        } catch (error: unknown) {
            if (error instanceof NotFoundException) {
                throw new UnauthorizedException('El usuario de la sesión ya no existe.');
            }

            throw error;
        }
    }

    async refrescar(id: string) {
        const usuario = await this.autorizar(id);
        const token = await this.generateToken({ ...usuario, _id: usuario.id });

        return { ...usuario, token };
    }

    generateToken(usuario: { _id: { toString(): string }; correo: string; rol: string }) {
        const payload = {
            correo: usuario.correo,
            sub: usuario._id.toString(),
            rol: usuario.rol,
        };

        return this.jwtService.signAsync(payload);
    }

    setTokenCookie(res: Response, token: string) {
        const payload = this.jwtService.decode<{ iat: number; exp: number }>(token);

        res.cookie('token', token, {
            ...this.opcionesCookie,
            maxAge: Math.max(0, payload.exp * 1000 - Date.now()),
        });

        return this.tiemposSesion(payload);
    }

    tiemposSesion(payload: { iat: number; exp: number }) {
        return {
            avisoEn: payload.iat * 1000 + 15 * 1000,
            // avisoEn: payload.iat * 1000 + 10 * 60 * 1000,
            venceEn: payload.exp * 1000,
        };
    }

    cerrarSesion(res: Response): void {
        res.clearCookie('token', this.opcionesCookie);
    }
}
