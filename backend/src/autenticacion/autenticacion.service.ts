import { PasswordHasher } from '@nestjs/authentication';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUsuarioDto } from './dto/register-usuario.dto.js';
import { LoginUsuarioDto } from './dto/login-usuario.dto.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';

@Injectable()
export class AutenticacionService {
    private readonly opcionesCookie: CookieOptions = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    };

    constructor(
        private readonly passwordHasher: PasswordHasher,
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
    ) { }

    async registerUser(registerDto: RegisterUsuarioDto, imagen: Express.Multer.File) {
        const usuario = await this.usuariosService.crear(registerDto, imagen, 'usuario');

        return {
            ...usuario,
            token: await this.generateToken({ ...usuario, _id: usuario.id }),
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

        if (!usuario.habilitado) {
            throw new ForbiddenException('Tu usuario está deshabilitado. No estás autorizado a ingresar.');
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

    autorizar(id: string) {
        return this.usuariosService.obtenerUsuarioHabilitado(id);
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
