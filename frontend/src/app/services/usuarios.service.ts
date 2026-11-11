import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UsuarioAutenticado } from './autenticacion.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly http = inject(HttpClient);

    private readonly url = `${environment.apiUrl}/usuarios`;

    obtenerPerfil(): Observable<UsuarioAutenticado> {
        return this.http.get<UsuarioAutenticado>(`${this.url}/mi-perfil`);
    }

    actualizarPerfil(datos: FormData): Observable<UsuarioAutenticado> {
        return this.http.patch<UsuarioAutenticado>(`${this.url}/mi-perfil`, datos);
    }
}
