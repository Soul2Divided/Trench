import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioAutenticado {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    nombreUsuario: string;
    fechaNacimiento: string;
    descripcion: string;
    imagenPerfilUrl: string;
    rol: 'usuario' | 'administrador';
}

export interface RespuestaAutenticacion extends UsuarioAutenticado {
    avisoEn: number;
    venceEn: number;
}

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private readonly url = `${environment.apiUrl.replace(/\/$/, '')}/autenticacion`;
    private readonly usuario = signal<UsuarioAutenticado | null>(null);
    private readonly validando = signal(true);
    private readonly aviso = signal(false);
    private readonly avisoSesionExpirada = signal(false);

    private temporizadorAviso?: ReturnType<typeof setTimeout>;
    private venceEn?: number;
    private validacionInicial?: Observable<RespuestaAutenticacion | null>;

    readonly usuarioActual = this.usuario.asReadonly();
    readonly validandoSesion = this.validando.asReadonly();
    readonly mostrarAviso = this.aviso.asReadonly();

    constructor() {
        this.destroyRef.onDestroy(() => this.limpiarTemporizadores());
    }

    validarSesion(): Observable<RespuestaAutenticacion | null> {
        if (!this.validacionInicial) {
            this.validacionInicial = this.autorizar().pipe(
                catchError(() => {
                    this.limpiarSesion();

                    return of(null);
                }),
                finalize(() => this.validando.set(false)),
                // Comparte una misma ejecución entre quienes se suscriben 
                // y conserva el último resultado para entregárselo a quienes se suscriban después
                shareReplay(1),
            );
        }

        return this.validacionInicial;
    }

    login(correo: string, contrasena: string): Observable<RespuestaAutenticacion> {
        return this.http.post<RespuestaAutenticacion>(`${this.url}/login`, { correo, contrasena })
            .pipe(tap(respuesta => this.guardarSesion(respuesta)));
    }

    registrar(datos: FormData): Observable<RespuestaAutenticacion> {
        return this.http.post<RespuestaAutenticacion>(`${this.url}/registro`, datos)
            .pipe(tap(respuesta => this.guardarSesion(respuesta)));
    }

    autorizar(): Observable<RespuestaAutenticacion> {
        return this.http.post<RespuestaAutenticacion>(`${this.url}/autorizar`, {})
            .pipe(tap(respuesta => this.guardarSesion(respuesta)));
    }

    refrescar(): Observable<RespuestaAutenticacion> {
        return this.http.post<RespuestaAutenticacion>(`${this.url}/refrescar`, {})
            .pipe(tap(respuesta => this.guardarSesion(respuesta)));
    }

    actualizarUsuario(usuario: UsuarioAutenticado): void {
        this.usuario.set(usuario);
    }

    cerrarSesion(): void {
        this.limpiarSesion();
        this.http.post(`${this.url}/logout`, {}).subscribe({ error: () => {} });
    }

    limpiarSesion(sesionExpirada = false): void {
        this.limpiarTemporizadores();
        this.usuario.set(null);
        this.aviso.set(false);
        this.avisoSesionExpirada.set(sesionExpirada);

        void this.router.navigate(['/login']);
    }

    consumirAvisoSesionExpirada(): boolean {
        const sesionExpirada = this.avisoSesionExpirada();

        this.avisoSesionExpirada.set(false);

        return sesionExpirada;
    }

    ocultarAviso(): void {
        this.aviso.set(false);
        clearTimeout(this.temporizadorAviso);
    }

    estaSesionVencida(): boolean {
        return this.venceEn !== undefined && Date.now() >= this.venceEn;
    }

    private guardarSesion(respuesta: RespuestaAutenticacion): void {
        const avisoEn = respuesta.avisoEn;
        const venceEn = respuesta.venceEn;
        const usuario: UsuarioAutenticado = {
            id: respuesta.id,
            nombre: respuesta.nombre,
            apellido: respuesta.apellido,
            correo: respuesta.correo,
            nombreUsuario: respuesta.nombreUsuario,
            fechaNacimiento: respuesta.fechaNacimiento,
            descripcion: respuesta.descripcion,
            imagenPerfilUrl: respuesta.imagenPerfilUrl,
            rol: respuesta.rol,
        };

        this.limpiarTemporizadores();
        this.actualizarUsuario(usuario);
        this.aviso.set(false);
        this.avisoSesionExpirada.set(false);
        this.venceEn = venceEn;
        this.temporizadorAviso = setTimeout(() => this.aviso.set(true), Math.max(0, avisoEn - Date.now()));
    }

    private limpiarTemporizadores(): void {
        clearTimeout(this.temporizadorAviso);
        this.venceEn = undefined;
    }
}
