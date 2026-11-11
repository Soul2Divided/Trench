import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { SolicitudAutenticada } from './auth.guard.js';

@Injectable()
export class AdministradorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<SolicitudAutenticada>();

        if (request.user?.rol !== 'administrador') {
            throw new ForbiddenException('Solo un administrador puede realizar esta acción.');
        }

        return true;
    }
}
