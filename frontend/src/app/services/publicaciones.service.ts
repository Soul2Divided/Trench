import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { ComentarioPublicacion, ConsultaPublicaciones, PaginaPublicaciones, Publicacion } from '../models/publicacion';
import { AutenticacionService } from './autenticacion.service';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
    private readonly http = inject(HttpClient);
    private readonly autenticacion = inject(AutenticacionService);

    private readonly url = 'http://localhost:3000/publicaciones';

    listar(consulta: ConsultaPublicaciones): Observable<PaginaPublicaciones> {
        let params = new HttpParams()
            .set('offset', consulta.offset)
            .set('limit', consulta.limit)
            .set('orden', consulta.orden);

        if (consulta.usuarioId) {
            params = params.set('usuarioId', consulta.usuarioId);
        }

        return this.http.get<PaginaPublicaciones>(this.url, { params });
    }

    crear(datos: FormData): Observable<Publicacion> {
        const usuario = this.autenticacion.usuarioActual();

        if (!usuario) {
            return throwError(() => new Error('Iniciá sesión para crear una publicación.'));
        }

        datos.set('usuarioId', usuario.id);

        return this.http.post<Publicacion>(this.url, datos);
    }

    eliminar(id: string): Observable<void> {
        const usuario = this.autenticacion.usuarioActual();

        if (!usuario) {
            return throwError(() => new Error('Iniciá sesión para eliminar una publicación.'));
        }

        const params = new HttpParams().set('usuarioId', usuario.id);

        return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`, { params });
    }

    obtenerComentarios(id: string): Observable<ComentarioPublicacion[]> {
        return this.http.get<ComentarioPublicacion[]>(`${this.url}/${encodeURIComponent(id)}/comentarios`);
    }
}
