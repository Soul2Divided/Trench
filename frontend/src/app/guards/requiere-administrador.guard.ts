import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AutenticacionService } from '../services/autenticacion.service';

export const requiereAdministrador: CanActivateFn = () => {
    const autenticacion = inject(AutenticacionService);
    const router = inject(Router);

    return autenticacion.validarSesion().pipe(
        map(() => {
            const usuario = autenticacion.usuarioActual();

            if (!usuario) {
                return router.createUrlTree(['/login']);
            }

            return usuario.rol === 'administrador' || router.createUrlTree(['/publicaciones']);
        }),
    );
};
