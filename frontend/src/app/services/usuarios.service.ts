import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UsuarioAutenticado } from './autenticacion.service';
import { environment } from '../../environments/environment';

export interface UsuarioAdministrado extends UsuarioAutenticado {
    habilitado: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly http = inject(HttpClient);

    private readonly url = `${environment.apiUrl.replace(/\/$/, '')}/usuarios`;

    listar(): Observable<UsuarioAdministrado[]> {
        return this.http.get<UsuarioAdministrado[]>(this.url);
    }

    crear(datos: FormData): Observable<UsuarioAdministrado> {
        return this.http.post<UsuarioAdministrado>(this.url, datos);
    }

    deshabilitar(id: string): Observable<UsuarioAdministrado> {
        return this.http.delete<UsuarioAdministrado>(`${this.url}/${id}`);
    }

    habilitar(id: string): Observable<UsuarioAdministrado> {
        return this.http.post<UsuarioAdministrado>(`${this.url}/${id}/habilitar`, {});
    }

    obtenerPerfil(): Observable<UsuarioAutenticado> {
        return this.http.get<UsuarioAutenticado>(`${this.url}/mi-perfil`);
    }

    actualizarPerfil(datos: FormData): Observable<UsuarioAutenticado> {
        return this.http.patch<UsuarioAutenticado>(`${this.url}/mi-perfil`, datos);
    }
}
