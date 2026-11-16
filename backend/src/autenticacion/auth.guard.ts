import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsuariosService } from '../usuarios/usuarios.service.js';

export interface SolicitudAutenticada extends Request {
    user: {
        sub: string;
        correo: string;
        rol: 'usuario' | 'administrador';
        iat: number;
        exp: number;
    };
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usuariosService: UsuariosService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const token = this.extractTokenFromCookie(context);

        if (!token) {
            throw new UnauthorizedException('Se requiere un token de acceso.');
        }

        let payload: SolicitudAutenticada['user'];

        try {
            payload = this.jwtService.verify<SolicitudAutenticada['user']>(token, {
                algorithms: ['HS256'],
            });
        } catch {
            throw new UnauthorizedException('El token es inválido o venció.');
        }

        const usuario = await this.usuariosService.obtenerUsuarioHabilitado(payload.sub);

        context.switchToHttp().getRequest<SolicitudAutenticada>().user = {
            ...payload,
            correo: usuario.correo,
            rol: usuario.rol,
        };

        return true;
    }

    extractTokenFromCookie(context: ExecutionContext): string | null {
        const request = context.switchToHttp().getRequest<Request>();

        return request.cookies?.token ?? null;
    }
}
