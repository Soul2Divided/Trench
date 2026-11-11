import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ComentarioPublicacion, ConsultaPublicaciones, EstadoMeGusta, PaginaComentarios, PaginaPublicaciones, Publicacion } from '../models/publicacion';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
    private readonly http = inject(HttpClient);

    private readonly url = `${environment.apiUrl}/publicaciones`;

    listar(consulta: ConsultaPublicaciones): Observable<PaginaPublicaciones> {
        let params = new HttpParams()
            .set('offset', consulta.offset)
            .set('limit', consulta.limit)
            .set('orden', consulta.orden);

        if (consulta.autorId) {
            params = params.set('autorId', consulta.autorId);
        }

        return this.http.get<PaginaPublicaciones>(this.url, { params });
    }

    crear(datos: FormData): Observable<Publicacion> {
        return this.http.post<Publicacion>(this.url, datos);
    }

    eliminar(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
    }

    cambiarMeGusta(id: string, darMeGusta: boolean): Observable<EstadoMeGusta> {
        const url = `${this.url}/${encodeURIComponent(id)}/me-gusta`;

        if (darMeGusta) {
            return this.http.post<EstadoMeGusta>(url, {});
        }

        return this.http.delete<EstadoMeGusta>(url);
    }

    obtenerComentarios(id: string, offset: number, limit: number): Observable<PaginaComentarios> {
        const params = new HttpParams().set('offset', offset).set('limit', limit);

        return this.http.get<PaginaComentarios>(`${this.url}/${encodeURIComponent(id)}/comentarios`, { params });
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

    eliminarComentario(id: string, comentarioId: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}/comentarios/${encodeURIComponent(comentarioId)}`);
    }
}
