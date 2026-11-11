import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AutenticacionService } from '../services/autenticacion.service';

export const autenticacionInterceptor: HttpInterceptorFn = (solicitud, siguiente) => {
    const apiUrl = environment.apiUrl.replace(/\/$/, '');

    if (!solicitud.url.startsWith(`${apiUrl}/`)) {
        return siguiente(solicitud);
    }

    const autenticacion = inject(AutenticacionService);
    const esIngreso = ['/autenticacion/login', '/autenticacion/registro', '/autenticacion/logout']
        .some(ruta => solicitud.url === `${apiUrl}${ruta}`);
    const peticion = solicitud.clone({ withCredentials: true });

    return siguiente(peticion).pipe(
        catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401 && !esIngreso) {
                autenticacion.limpiarSesion();
            }

            return throwError(() => error);
        }),
    );
};
