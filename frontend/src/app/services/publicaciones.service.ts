import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';

import { ComentarioPublicacion, ConsultaPublicaciones, EstadoMeGusta, PaginaComentarios, PaginaPublicaciones, Publicacion } from '../models/publicacion';
import { AutenticacionService } from './autenticacion.service';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
    private readonly http = inject(HttpClient);
    private readonly autenticacion = inject(AutenticacionService);

    private readonly url = `${environment.apiUrl}/publicaciones`;

    listar(consulta: ConsultaPublicaciones): Observable<PaginaPublicaciones> {
        let params = new HttpParams()
            .set('offset', consulta.offset)
            .set('limit', consulta.limit)
            .set('orden', consulta.orden);

        if (consulta.usuarioId) {
            params = params.set('usuarioId', consulta.usuarioId);
        }

        const usuario = this.autenticacion.usuarioActual();

        if (usuario) {
            params = params.set('usuarioActualId', usuario.id);
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

    cambiarMeGusta(id: string, darMeGusta: boolean): Observable<EstadoMeGusta> {
        const usuario = this.autenticacion.usuarioActual();

        if (!usuario) {
            return throwError(() => new Error('Iniciá sesión para dar me gusta.'));
        }

        const url = `${this.url}/${encodeURIComponent(id)}/me-gusta`;

        if (darMeGusta) {
            return this.http.post<EstadoMeGusta>(url, { usuarioId: usuario.id });
        }

        const params = new HttpParams().set('usuarioId', usuario.id);

        return this.http.delete<EstadoMeGusta>(url, { params });
    }

    obtenerComentarios(id: string, offset: number, limit: number): Observable<PaginaComentarios> {
        const params = new HttpParams().set('offset', offset).set('limit', limit);

        return this.http.get<PaginaComentarios | ComentarioPublicacion[]>(`${this.url}/${encodeURIComponent(id)}/comentarios`, { params })
            .pipe(map(respuesta => Array.isArray(respuesta)
                ? { comentarios: respuesta.slice(offset, offset + limit), total: respuesta.length }
                : respuesta));
    }

    crearComentario(id: string, mensaje: string): Observable<ComentarioPublicacion> {
        return this.http.post<ComentarioPublicacion>(`${this.url}/${encodeURIComponent(id)}/comentarios`, { mensaje });
    }

    editarComentario(id: string, comentarioId: string, mensaje: string): Observable<ComentarioPublicacion> {
        return this.http.put<ComentarioPublicacion>(
            `${this.url}/${encodeURIComponent(id)}/comentarios/${encodeURIComponent(comentarioId)}`,
            { mensaje },
        );
    }
}
