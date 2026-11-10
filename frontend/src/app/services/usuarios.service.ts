import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UsuarioAutenticado } from './autenticacion.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly http = inject(HttpClient);

    private readonly url = `${environment.apiUrl}/usuarios`;

    obtenerPorId(id: string): Observable<UsuarioAutenticado> {
        return this.http.get<UsuarioAutenticado>(`${this.url}/${encodeURIComponent(id)}`);
    }

    actualizarPerfil(id: string, datos: FormData): Observable<UsuarioAutenticado> {
        return this.http.patch<UsuarioAutenticado>(`${this.url}/${encodeURIComponent(id)}`, datos);
    }
}
