import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AutenticacionService } from '../services/autenticacion.service';

export const requiereSesion: CanActivateFn = () => {
    const autenticacion = inject(AutenticacionService);
    const router = inject(Router);

    return autenticacion.validarSesion().pipe(
        map(() => {
            if (autenticacion.estaSesionVencida()) {
                autenticacion.limpiarSesion(true);

                return false;
            }

            return autenticacion.usuarioActual() !== null || router.createUrlTree(['/login']);
        }),
    );
};
