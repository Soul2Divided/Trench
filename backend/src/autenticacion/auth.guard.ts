import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

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
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const token = this.extractTokenFromCookie(context);

        if (!token) {
            throw new UnauthorizedException('Se requiere un token de acceso.');
        }

        try {
            const payload = this.jwtService.verify<SolicitudAutenticada['user']>(token, {
                algorithms: ['HS256'],
            });

            context.switchToHttp().getRequest<SolicitudAutenticada>().user = payload;

            return true;
        } catch {
            throw new UnauthorizedException('El token es inválido o venció.');
        }
    }

    extractTokenFromCookie(context: ExecutionContext): string | null {
        const request = context.switchToHttp().getRequest<Request>();

        return request.cookies?.token ?? null;
    }
}
